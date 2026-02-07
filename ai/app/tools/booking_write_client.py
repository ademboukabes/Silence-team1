"""
Booking Write Service HTTP Client

Provides async interface for booking write operations (create, reschedule, cancel).
Uses a module-level singleton AsyncClient for efficient connection pooling.

Functions:
- create_booking: Create a new booking
- reschedule_booking: Reschedule an existing booking
- cancel_booking: Cancel an existing booking
- aclose_client: Close the HTTP client (call during app shutdown)

All functions forward Authorization headers and handle common HTTP errors.
SECURITY: Never leaks backend internal error messages to users.
"""

import os
import logging
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration - Read from environment
# ============================================================================

NEST_BASE_URL = os.getenv("NEST_BASE_URL", "http://localhost:3001")

# Endpoint paths (configurable via env)
BOOKING_CREATE_PATH = os.getenv("BOOKING_CREATE_PATH", "/bookings")
BOOKING_RESCHEDULE_PATH = os.getenv("BOOKING_RESCHEDULE_PATH", "/bookings/{booking_ref}/reschedule")
BOOKING_CANCEL_PATH = os.getenv("BOOKING_CANCEL_PATH", "/bookings/{booking_ref}/cancel")

# HTTP client timeout (seconds)
REQUEST_TIMEOUT = float(os.getenv("BOOKING_WRITE_CLIENT_TIMEOUT", "15.0"))

# Connection pool limits for scalability
MAX_CONNECTIONS = int(os.getenv("BOOKING_WRITE_CLIENT_MAX_CONNECTIONS", "100"))
MAX_KEEPALIVE_CONNECTIONS = int(os.getenv("BOOKING_WRITE_CLIENT_MAX_KEEPALIVE", "20"))

logger.info(f"Booking Write client configured with URL: {NEST_BASE_URL}")


# ============================================================================
# Module-level HTTP Client (Singleton with Connection Pooling)
# ============================================================================

_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    """
    Get or create the module-level httpx.AsyncClient singleton.
    Initializes client with connection pooling on first call.
    
    Returns:
        Shared httpx.AsyncClient instance
    """
    global _client
    
    # Create client if it doesn't exist or is closed
    if _client is None or _client.is_closed:
        limits = httpx.Limits(
            max_connections=MAX_CONNECTIONS,
            max_keepalive_connections=MAX_KEEPALIVE_CONNECTIONS
        )
        
        _client = httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            limits=limits,
            follow_redirects=False  # Explicit redirect handling
        )
        logger.info("Initialized Booking Write httpx.AsyncClient with connection pooling")
    
    return _client


async def aclose_client() -> None:
    """
    Close the module-level httpx.AsyncClient gracefully.
    Should be called during FastAPI shutdown (lifespan).
    
    NOTE: To properly close this client during app shutdown, add to your
    FastAPI lifespan or shutdown event handler:
    
    from app.tools import booking_write_client
    
    @app.on_event("shutdown")
    async def shutdown_event():
        await booking_write_client.aclose_client()
    """
    global _client
    
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        logger.info("Closed Booking Write httpx.AsyncClient")
        _client = None


# ============================================================================
# Helper Functions
# ============================================================================


def _build_headers(
    auth_header: Optional[str] = None,
    request_id: Optional[str] = None
) -> Dict[str, str]:
    """
    Build request headers with optional Authorization and x-request-id.
    
    Args:
        auth_header: Optional Authorization header value
        request_id: Optional request ID for tracing
    
    Returns:
        Headers dictionary
    """
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    if auth_header:
        headers["Authorization"] = auth_header
    
    if request_id:
        headers["x-request-id"] = request_id
    
    return headers


def _handle_http_error(e: httpx.HTTPStatusError) -> None:
    """
    Map httpx HTTP errors to FastAPI HTTPException with appropriate status codes.
    
    Security: Logs full backend error message server-side but exposes only
    safe, generic messages to prevent information leakage.
    
    Raises:
        HTTPException with appropriate status code and safe message
    """
    status_code = e.response.status_code
    
    # Try to extract error message from response (for logging only)
    try:
        error_data = e.response.json()
        error_message = error_data.get("message") or error_data.get("detail") or str(error_data)
    except Exception:
        error_message = e.response.text or f"Status {status_code}"
    
    # Log full error message server-side for debugging
    logger.warning(f"Booking write service error {status_code}: {error_message}")
    
    # Map status codes to SAFE user-facing messages (don't leak backend internals)
    if status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    elif status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden"
        )
    elif status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    elif status_code == 422:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid request data"
        )
    elif status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking service unavailable"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking service error"
        )


def _handle_connection_error(e: Exception) -> None:
    """
    Handle connection errors (timeout, network issues, etc.).
    
    Raises:
        HTTPException with 503 status
    """
    logger.error(f"Booking write service connection error: {type(e).__name__}: {e}")
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Cannot connect to booking service: {type(e).__name__}"
    )


def _normalize_booking(data: Any) -> Dict[str, Any]:
    """
    Normalize booking response to consistent format.
    Handles different response shapes and field names.
    
    Args:
        data: Raw booking data from backend
    
    Returns:
        Normalized booking dict with standard field names:
        {
            "booking_ref": str,
            "status": str,
            "terminal": str,
            "gate": str,
            "slot_id": str,
            "slot_time": str,
            "last_update": str
        }
    """
    if not isinstance(data, dict):
        return {"booking_ref": str(data), "status": "unknown"}
    
    # Extract nested data if present
    booking = data.get("data", data)
    
    # Normalize field names (try multiple possible field names)
    booking_ref = (
        booking.get("booking_ref") or
        booking.get("bookingRef") or
        booking.get("ref") or
        booking.get("reference") or
        booking.get("id") or
        "unknown"
    )
    
    status_value = (
        booking.get("status") or
        booking.get("bookingStatus") or
        "pending"
    )
    
    terminal = (
        booking.get("terminal") or
        booking.get("terminalId") or
        booking.get("terminal_id") or
        "N/A"
    )
    
    gate = (
        booking.get("gate") or
        booking.get("gateId") or
        booking.get("gate_id") or
        "N/A"
    )
    
    slot_id = (
        booking.get("slot_id") or
        booking.get("slotId") or
        booking.get("slot") or
        "N/A"
    )
    
    slot_time = (
        booking.get("slot_time") or
        booking.get("slotTime") or
        booking.get("timeWindow") or
        booking.get("time_window") or
        booking.get("scheduledTime") or
        "N/A"
    )
    
    last_update = (
        booking.get("last_update") or
        booking.get("lastUpdate") or
        booking.get("updatedAt") or
        booking.get("updated_at") or
        booking.get("createdAt") or
        booking.get("created_at") or
        "N/A"
    )
    
    normalized = {
        "booking_ref": str(booking_ref),
        "status": str(status_value),
        "terminal": str(terminal),
        "gate": str(gate),
        "slot_id": str(slot_id),
        "slot_time": str(slot_time),
        "last_update": str(last_update)
    }
    
    return normalized


# ============================================================================
# Public API Functions
# ============================================================================


async def create_booking(
    payload: Dict[str, Any],
    auth_header: Optional[str] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new booking.
    
    Args:
        payload: Booking data including:
            - terminal: str (required)
            - slot_id: str (required)
            - date: str (required, YYYY-MM-DD format)
            - gate: str (optional)
            - carrier_id: int (optional)
            - truck_id: str (optional)
            - driver_id: str (optional)
            - cargo_type: str (optional)
        auth_header: Optional Authorization header to forward
        request_id: Optional request ID for tracing
    
    Returns:
        Normalized booking dict with fields:
        - booking_ref: str
        - status: str
        - terminal: str
        - gate: str
        - slot_id: str
        - slot_time: str
        - last_update: str
    
    Raises:
        HTTPException: On backend errors (401, 403, 404, 422, 503, etc.)
    """
    url = f"{NEST_BASE_URL}{BOOKING_CREATE_PATH}"
    headers = _build_headers(auth_header, request_id)
    
    logger.debug(f"Creating booking for terminal {payload.get('terminal')}, slot {payload.get('slot_id')}")
    
    try:
        client = get_client()
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        normalized = _normalize_booking(data)
        logger.info(f"Created booking: {normalized['booking_ref']}")
        return normalized
    except httpx.HTTPStatusError as e:
        _handle_http_error(e)
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
        _handle_connection_error(e)
    except Exception as e:
        logger.exception(f"Unexpected error creating booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {type(e).__name__}"
        )


async def reschedule_booking(
    booking_ref: str,
    payload: Dict[str, Any],
    auth_header: Optional[str] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Reschedule an existing booking to a new slot.
    
    Args:
        booking_ref: Booking reference number (e.g., "REF12345")
        payload: Reschedule data including:
            - slot_id: str (required)
            - date: str (optional, YYYY-MM-DD format)
            - reason: str (optional)
        auth_header: Optional Authorization header to forward
        request_id: Optional request ID for tracing
    
    Returns:
        Normalized booking dict (same format as create_booking)
    
    Raises:
        HTTPException: On backend errors (401, 403, 404, 422, 503, etc.)
    """
    url = f"{NEST_BASE_URL}{BOOKING_RESCHEDULE_PATH}".format(booking_ref=booking_ref)
    headers = _build_headers(auth_header, request_id)
    
    logger.debug(f"Rescheduling booking {booking_ref} to slot {payload.get('slot_id')}")
    
    try:
        client = get_client()
        response = await client.put(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        normalized = _normalize_booking(data)
        logger.info(f"Rescheduled booking: {normalized['booking_ref']}")
        return normalized
    except httpx.HTTPStatusError as e:
        _handle_http_error(e)
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
        _handle_connection_error(e)
    except Exception as e:
        logger.exception(f"Unexpected error rescheduling booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {type(e).__name__}"
        )


async def cancel_booking(
    booking_ref: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_header: Optional[str] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Cancel an existing booking.
    
    Args:
        booking_ref: Booking reference number (e.g., "REF12345")
        payload: Optional cancellation data including:
            - reason: str (optional)
        auth_header: Optional Authorization header to forward
        request_id: Optional request ID for tracing
    
    Returns:
        Normalized booking dict (same format as create_booking)
    
    Raises:
        HTTPException: On backend errors (401, 403, 404, 422, 503, etc.)
    """
    url = f"{NEST_BASE_URL}{BOOKING_CANCEL_PATH}".format(booking_ref=booking_ref)
    headers = _build_headers(auth_header, request_id)
    
    logger.debug(f"Canceling booking {booking_ref}")
    
    try:
        client = get_client()
        if payload:
            response = await client.delete(url, json=payload, headers=headers)
        else:
            response = await client.delete(url, headers=headers)
        response.raise_for_status()
        
        # Some backends return 204 No Content
        if response.status_code == 204:
            logger.info(f"Canceled booking {booking_ref}")
            return {
                "booking_ref": booking_ref,
                "status": "canceled",
                "terminal": "N/A",
                "gate": "N/A",
                "slot_id": "N/A",
                "slot_time": "N/A",
                "last_update": "N/A"
            }
        
        data = response.json()
        normalized = _normalize_booking(data)
        logger.info(f"Canceled booking: {normalized['booking_ref']}")
        return normalized
    except httpx.HTTPStatusError as e:
        _handle_http_error(e)
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
        _handle_connection_error(e)
    except Exception as e:
        logger.exception(f"Unexpected error canceling booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {type(e).__name__}"
        )
