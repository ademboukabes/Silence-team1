"""
Booking Create Agent - Handles booking creation (write operations)

Responsibilities:
- Extract and validate booking parameters from user queries
- Smart slot selection with two strategies:
  1. Direct booking: if slot_id provided
  2. Auto-recommend: fetch availability + recommend best slot + book
- Integrate carrier scoring for intelligent recommendations
- Call real booking service backend to create bookings
- Return structured confirmation with booking details
- Graceful fallbacks when services unavailable

IMPORTANT: Does NOT handle status queries (BookingAgent handles that)
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import date, timedelta
from fastapi import HTTPException

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class BookingCreateAgent(BaseAgent):
    """
    Agent specialized in handling booking creation requests.
    
    Inherits from BaseAgent which provides:
    - async execute() method (called by orchestrator)
    - run() method (implemented here)
    - Helper methods for response formatting
    """

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Core business logic for booking creation.
        
        Args:
            context: Full context dictionary from orchestrator containing:
                - message: User's query
                - entities: Extracted entities
                - history: Normalized conversation history
                - user_role: User role (ADMIN/OPERATOR/CARRIER)
                - user_id: User identifier
                - trace_id: Request trace ID
                - auth_header: Authorization header (required)
        
        Returns:
            Structured response with message, data, and proofs
        """
        # Extract context using BaseAgent helpers
        trace_id = self.get_trace_id(context)
        entities = self.get_entities(context)
        user_role = self.get_user_role(context)
        auth_header = self.get_auth_header(context)
        
        # Validate auth header (required for booking creation)
        if not auth_header:
            return self.error_response(
                message="Authentication required to create a booking. Please ensure you're logged in.",
                trace_id=trace_id,
                error_type="Unauthorized"
            )
        
        # Extract and validate booking parameters
        params = self._extract_booking_params(entities)
        
        # Validate required fields
        if not params.get("terminal"):
            return self.validation_error(
                message="I couldn't identify the terminal. Please specify which terminal you want to book.",
                suggestion="Try asking: 'Book terminal A tomorrow' or 'Reserve slot at terminal B'",
                missing_field="terminal",
                example="Terminal A",
                trace_id=trace_id
            )
        
        if not params.get("date"):
            return self.validation_error(
                message="I couldn't identify the booking date. Please specify when you want to book.",
                suggestion="Try asking: 'Book terminal A tomorrow' or 'Reserve for 2026-02-08'",
                missing_field="date",
                example="tomorrow or 2026-02-08",
                trace_id=trace_id
            )
        
        # Log minimal info (privacy: no full message)
        logger.info(f"[{trace_id[:8]}] BookingCreateAgent: terminal={params['terminal']}, date={params['date']}")
        
        # Execute booking strategy
        try:
            if params.get("slot_id"):
                # Strategy 1: Direct booking with slot_id
                return await self._direct_booking(params, auth_header, trace_id, user_role)
            else:
                # Strategy 2: Smart booking (fetch availability + recommend + book)
                return await self._smart_booking(params, auth_header, trace_id, user_role, context)
        except HTTPException as e:
            # Convert HTTP exceptions to user-friendly messages
            return self._handle_service_error(e, params, trace_id)
        except Exception as e:
            # Unexpected errors
            logger.exception(f"[{trace_id[:8]}] Unexpected error in BookingCreateAgent: {e}")
            return self.error_response(
                message="I encountered an unexpected error while creating the booking. Please try again.",
                trace_id=trace_id,
                error_type=type(e).__name__
            )

    def _extract_booking_params(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract booking parameters from entities.
        
        Args:
            entities: Extracted entities dict from orchestrator
        
        Returns:
            Dict with normalized booking parameters
        """
        params = {}
        
        # Terminal (required)
        params["terminal"] = entities.get("terminal")
        
        # Date (required) - parse from various formats
        params["date"] = self._parse_date(entities)
        
        # Gate (optional)
        params["gate"] = entities.get("gate")
        
        # Slot ID (optional)
        params["slot_id"] = entities.get("slot_id")
        
        # Carrier ID (optional)
        carrier_id = entities.get("carrier_id")
        if carrier_id:
            # Ensure it's an integer
            try:
                params["carrier_id"] = int(carrier_id)
            except (ValueError, TypeError):
                params["carrier_id"] = None
        
        # Truck ID (optional)
        params["truck_id"] = entities.get("truck_id")
        
        # Driver ID (optional)
        params["driver_id"] = entities.get("driver_id")
        
        # Cargo type (optional)
        params["cargo_type"] = entities.get("cargo_type")
        
        return params

    def _parse_date(self, entities: Dict[str, Any]) -> Optional[str]:
        """
        Parse date from entities (handles keywords and explicit dates).
        
        Returns:
            Date string in YYYY-MM-DD format or None
        """
        # Check for date keywords
        if entities.get("date_today"):
            return date.today().isoformat()
        elif entities.get("date_tomorrow"):
            return (date.today() + timedelta(days=1)).isoformat()
        elif entities.get("date_yesterday"):
            # BUG FIX: was -(-1) which equals +1 (tomorrow!)
            return (date.today() - timedelta(days=1)).isoformat()
        
        # Check for explicit date (YYYY-MM-DD format)
        # Entity extractor might add this in the future
        explicit_date = entities.get("date") or entities.get("date_explicit")
        if explicit_date and isinstance(explicit_date, str):
            # Validate format
            try:
                date.fromisoformat(explicit_date)
                return explicit_date
            except ValueError:
                pass
        
        return None

    async def _direct_booking(
        self,
        params: Dict[str, Any],
        auth_header: str,
        trace_id: str,
        user_role: str
    ) -> Dict[str, Any]:
        """
        Strategy 1: Direct booking when slot_id is provided.
        
        Args:
            params: Booking parameters including slot_id
            auth_header: Authorization header
            trace_id: Request trace ID
            user_role: User role
        
        Returns:
            Structured response with booking confirmation
        """
        from app.tools import booking_write_client
        
        # Build booking payload
        payload = {
            "terminal": params["terminal"],
            "slot_id": params["slot_id"],
            "date": params["date"]
        }
        
        # Add optional fields
        if params.get("gate"):
            payload["gate"] = params["gate"]
        if params.get("carrier_id"):
            payload["carrier_id"] = params["carrier_id"]
        if params.get("truck_id"):
            payload["truck_id"] = params["truck_id"]
        if params.get("driver_id"):
            payload["driver_id"] = params["driver_id"]
        if params.get("cargo_type"):
            payload["cargo_type"] = params["cargo_type"]
        
        logger.info(f"[{trace_id[:8]}] Direct booking: slot_id={params['slot_id']}")
        
        # Call booking service
        booking_data = await booking_write_client.create_booking(
            payload=payload,
            auth_header=auth_header,
            request_id=trace_id[:8]
        )
        
        # Build user-facing message
        message = (
            f"✅ Booking created successfully!\n\n"
            f"Booking Reference: {booking_data['booking_ref']}\n"
            f"Status: {booking_data['status']}\n"
            f"Terminal: {booking_data['terminal']}\n"
            f"Gate: {booking_data['gate']}\n"
            f"Slot: {booking_data['slot_id']}\n"
            f"Time: {booking_data['slot_time']}\n\n"
            f"Please save your booking reference for future inquiries."
        )
        
        # Build structured response
        return {
            "message": message,
            "data": {
                "booking_ref": booking_data["booking_ref"],
                "status": booking_data["status"],
                "terminal": booking_data["terminal"],
                "gate": booking_data["gate"],
                "slot_id": booking_data["slot_id"],
                "slot_time": booking_data["slot_time"],
                "last_update": booking_data["last_update"],
                "strategy": "direct"
            },
            "proofs": {
                "trace_id": trace_id,
                "sources": [
                    {
                        "type": "booking_create",
                        "service": booking_write_client.NEST_BASE_URL,
                        "endpoint": booking_write_client.BOOKING_CREATE_PATH
                    }
                ],
                "request_id": trace_id[:8],
                "user_role": user_role
            }
        }

    async def _smart_booking(
        self,
        params: Dict[str, Any],
        auth_header: str,
        trace_id: str,
        user_role: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Strategy 2: Smart booking without slot_id.
        Fetches availability, recommends best slot, then books.
        
        Args:
            params: Booking parameters (no slot_id)
            auth_header: Authorization header
            trace_id: Request trace ID
            user_role: User role
            context: Full context (for model predictions)
        
        Returns:
            Structured response with booking confirmation and recommendation rationale
        """
        from app.tools import slot_service_client, booking_write_client
        from app.algorithms.slot_recommender import recommend_slots
        
        logger.info(f"[{trace_id[:8]}] Smart booking: fetching availability...")
        
        # Step 1: Get available slots
        try:
            slots = await slot_service_client.get_availability(
                terminal=params["terminal"],
                date=params["date"],
                gate=params.get("gate"),
                auth_header=auth_header,
                request_id=trace_id[:8]
            )
        except HTTPException as e:
            # Check if endpoint is missing
            if slot_service_client.is_endpoint_missing(e):
                # MVP fallback: explain what's needed
                return self._mvp_fallback_no_slot_service(params, trace_id)
            else:
                # Other error (auth, network, etc.)
                raise
        
        if not slots:
            return self.error_response(
                message=f"No available slots found for terminal {params['terminal']} on {params['date']}. Please try a different date or terminal.",
                trace_id=trace_id,
                error_type="NoAvailability"
            )
        
        logger.info(f"[{trace_id[:8]}] Found {len(slots)} available slots")
        
        # Step 2: Carrier score (models removed - set to None, algorithm will handle)
        carrier_score = None
        if params.get("carrier_id"):
            # TODO: Future integration point for carrier scoring
            logger.debug(f"[{trace_id[:8]}] Carrier scoring not available (models removed)")

        
        # Step 3: Run slot recommender
        requested = {
            "start": f"{params['date']} 09:00:00",  # Default to morning
            "terminal": params["terminal"],
            "gate": params.get("gate")
        }
        
        reco_result = recommend_slots(
            requested=requested,
            candidates=slots,
            carrier_score=carrier_score
        )
        
        if not reco_result.get("recommended"):
            return self.error_response(
                message="I couldn't find any suitable slots to recommend. Please try different criteria.",
                trace_id=trace_id,
                error_type="NoRecommendation"
            )
        
        # Select top recommended slot
        top_slot = reco_result["recommended"][0]
        logger.info(f"[{trace_id[:8]}] Recommended slot: {top_slot['slot_id']}")
        
        # Step 4: Create booking with recommended slot
        payload = {
            "terminal": params["terminal"],
            "slot_id": top_slot["slot_id"],
            "date": params["date"],
            "gate": top_slot.get("gate") or params.get("gate")
        }
        
        # Add optional fields
        if params.get("carrier_id"):
            payload["carrier_id"] = params["carrier_id"]
        if params.get("truck_id"):
            payload["truck_id"] = params["truck_id"]
        if params.get("driver_id"):
            payload["driver_id"] = params["driver_id"]
        if params.get("cargo_type"):
            payload["cargo_type"] = params["cargo_type"]
        
        booking_data = await booking_write_client.create_booking(
            payload=payload,
            auth_header=auth_header,
            request_id=trace_id[:8]
        )
        
        # Build user-facing message with recommendation rationale
        recommendation_rationale = "\n".join(reco_result.get("reasons", []))
        rank_reasons = top_slot.get("rank_reasons", [])
        
        message = (
            f"✅ Booking created successfully!\n\n"
            f"Booking Reference: {booking_data['booking_ref']}\n"
            f"Status: {booking_data['status']}\n"
            f"Terminal: {booking_data['terminal']}\n"
            f"Gate: {booking_data['gate']}\n"
            f"Slot: {booking_data['slot_id']}\n"
            f"Time: {booking_data['slot_time']}\n\n"
            f"📊 Why this slot?\n"
            f"{recommendation_rationale}\n\n"
            f"Additional details: {', '.join(rank_reasons[:2])}\n\n"
            f"Please save your booking reference for future inquiries."
        )
        
        # Build structured response
        return {
            "message": message,
            "data": {
                "booking_ref": booking_data["booking_ref"],
                "status": booking_data["status"],
                "terminal": booking_data["terminal"],
                "gate": booking_data["gate"],
                "slot_id": booking_data["slot_id"],
                "slot_time": booking_data["slot_time"],
                "last_update": booking_data["last_update"],
                "strategy": reco_result.get("strategy", "standard"),
                "recommendation_rationale": recommendation_rationale,
                "carrier_score": carrier_score,
                "alternatives_count": len(reco_result.get("recommended", [])) - 1
            },
            "proofs": {
                "trace_id": trace_id,
                "sources": [
                    {
                        "type": "slot_service",
                        "service": slot_service_client.SLOT_SERVICE_URL,
                        "endpoint": slot_service_client.SLOT_AVAILABILITY_PATH
                    },
                    {
                        "type": "booking_create",
                        "service": booking_write_client.NEST_BASE_URL,
                        "endpoint": booking_write_client.BOOKING_CREATE_PATH
                    }
                ],
                "request_id": trace_id[:8],
                "user_role": user_role
            }
        }

    def _mvp_fallback_no_slot_service(
        self,
        params: Dict[str, Any],
        trace_id: str
    ) -> Dict[str, Any]:
        """
        MVP fallback when slot service is unavailable.
        Explains what's needed to complete the booking.
        """
        message = (
            f"To create a booking for terminal {params['terminal']} on {params['date']}, "
            f"I need access to the slot availability service.\n\n"
            f"The service appears to be unavailable. You have two options:\n\n"
            f"1. Provide a specific slot ID if you already know which slot you want:\n"
            f"   Example: 'Book slot SLOT-123 at terminal {params['terminal']} on {params['date']}'\n\n"
            f"2. Contact your administrator to ensure the slot service is running.\n\n"
            f"Required endpoints:\n"
            f"- Slot Availability: {slot_service_client.SLOT_SERVICE_URL}{slot_service_client.SLOT_AVAILABILITY_PATH}\n"
            f"- Booking Creation: {booking_write_client.NEST_BASE_URL}{booking_write_client.BOOKING_CREATE_PATH}"
        )
        
        # Import at function level to avoid circular imports
        from app.tools import slot_service_client, booking_write_client
        
        return {
            "message": message,
            "data": {
                "error": "slot_service_unavailable",
                "required_endpoints": [
                    f"{slot_service_client.SLOT_SERVICE_URL}{slot_service_client.SLOT_AVAILABILITY_PATH}",
                    f"{booking_write_client.NEST_BASE_URL}{booking_write_client.BOOKING_CREATE_PATH}"
                ],
                "workaround": "Provide explicit slot_id"
            },
            "proofs": {
                "trace_id": trace_id,
                "status": "failed",
                "error_type": "ServiceUnavailable"
            }
        }

    def _handle_service_error(
        self,
        http_exception: HTTPException,
        params: Dict[str, Any],
        trace_id: str
    ) -> Dict[str, Any]:
        """
        Convert HTTP exceptions from services to user-friendly messages.
        
        Args:
            http_exception: HTTPException from service
            params: Booking parameters that were attempted
            trace_id: Request trace ID
        
        Returns:
            User-friendly error response
        """
        status_code = http_exception.status_code
        
        # Map HTTP status codes to user-friendly messages
        if status_code == 401:
            message = "Your session has expired. Please log in again to create a booking."
            error_type = "Unauthorized"
        elif status_code == 403:
            message = "You don't have permission to create bookings."
            error_type = "Forbidden"
        elif status_code == 404:
            message = (
                f"The requested resource was not found. This usually means:\n"
                f"- Terminal {params.get('terminal')} doesn't exist\n"
                f"- The booking service endpoint is not configured\n"
                f"Please verify the terminal name and try again."
            )
            error_type = "NotFound"
        elif status_code == 422:
            message = (
                f"The booking request has invalid data. Please check:\n"
                f"- Terminal: {params.get('terminal')}\n"
                f"- Date: {params.get('date')}\n"
                f"- Slot ID: {params.get('slot_id') or 'auto-select'}\n"
                f"All fields must be valid."
            )
            error_type = "ValidationError"
        elif status_code == 503:
            message = "The booking service is temporarily unavailable. Please try again in a moment."
            error_type = "ServiceUnavailable"
        else:
            message = "I couldn't create the booking at this time. Please try again later."
            error_type = "ServiceError"
        
        logger.warning(f"[{trace_id[:8]}] Booking service error {status_code}: {http_exception.detail}")
        
        return self.error_response(
            message=message,
            trace_id=trace_id,
            error_type=error_type,
            status_code=status_code
        )
