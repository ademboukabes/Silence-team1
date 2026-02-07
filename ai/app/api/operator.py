"""
Operator API Endpoints

Operational endpoints for booking status checks and slot availability.

Endpoints:
- GET /operator/bookings/{booking_ref}/status - Get booking status
- POST /operator/bookings/status/batch - Get multiple booking statuses
- GET /operator/slots/availability - Get slot availability

All endpoints require ADMIN or OPERATOR role.
"""

import logging
import uuid
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, HTTPException, Request, status, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/operator", tags=["operator"])

# ============================================================================
# Schemas
# ============================================================================

class BatchStatusRequest(BaseModel):
    """Request body for batch status check."""
    refs: List[str] = Field(description="List of booking references")


# ============================================================================
# Utilities
# ============================================================================

def get_trace_id(request: Request) -> str:
    """Extract or generate trace ID from request."""
    return request.headers.get("x-request-id", str(uuid.uuid4()))


def get_auth_header(request: Request) -> Optional[str]:
    """Extract Authorization header."""
    return request.headers.get("authorization")


def get_role(request: Request) -> str:
    """Extract user role from headers."""
    return request.headers.get("x-user-role", "ANON").upper().strip()


def require_operator_or_admin(request: Request) -> None:
    """Require ADMIN or OPERATOR role, raise 403 if not."""
    role = get_role(request)
    if role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operator or Admin access required (your role: {role})"
        )


def standard_response(
    message: str,
    data: Optional[Dict[str, Any]] = None,
    proofs: Optional[Dict[str, Any]] = None,
    trace_id: Optional[str] = None
) -> Dict[str, Any]:
    """Build standard response format."""
    return {
        "message": message,
        "data": data or {},
        "proofs": proofs or {"trace_id": trace_id}
    }


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/bookings/{booking_ref}/status")
async def get_booking_status(
    booking_ref: str,
    request: Request
):
    """
    Get booking status by reference.
    
    **Requires**: ADMIN or OPERATOR role
    """
    require_operator_or_admin(request)
    trace_id = get_trace_id(request)
    auth_header = get_auth_header(request)
    
    try:
        from app.tools.booking_service_client import get_booking_status
        
        booking = await get_booking_status(
            booking_ref=booking_ref,
            auth_header=auth_header,
            request_id=trace_id[:8]
        )
        
        return standard_response(
            message=f"Booking {booking_ref} status retrieved",
            data=booking,
            trace_id=trace_id
        )
        
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Failed to get booking status: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to retrieve booking status"
        )


@router.post("/bookings/status/batch")
async def get_batch_status(
    body: BatchStatusRequest,
    request: Request
):
    """
    Get status for multiple bookings.
    
    **Requires**: ADMIN or OPERATOR role
    """
    require_operator_or_admin(request)
    trace_id = get_trace_id(request)
    auth_header = get_auth_header(request)
    
    if not body.refs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one booking reference is required"
        )
    
    if len(body.refs) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 booking references allowed per request"
        )
    
    try:
        from app.tools.booking_service_client import get_bookings_batch
        
        bookings = await get_bookings_batch(
            booking_refs=body.refs,
            auth_header=auth_header,
            request_id=trace_id[:8]
        )
        
        return standard_response(
            message=f"Retrieved status for {len(bookings)} bookings",
            data={
                "bookings": bookings,
                "requested_count": len(body.refs),
                "retrieved_count": len(bookings)
            },
            trace_id=trace_id
        )
        
    except HTTPException as e:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Failed to get batch status: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to retrieve batch booking status"
        )


@router.get("/slots/availability")
async def get_slot_availability(
    request: Request,
    terminal: str = Query(description="Terminal identifier (A, B, C, etc.)"),
    date: str = Query(description="Date in YYYY-MM-DD format"),
    gate: Optional[str] = Query(None, description="Optional gate filter")
):
    """
    Get slot availability for terminal and date.
    
    **Requires**: ADMIN or OPERATOR role
    """
    require_operator_or_admin(request)
    trace_id = get_trace_id(request)
    auth_header = get_auth_header(request)
    
    try:
        from app.tools.slot_service_client import get_availability
        
        slots = await get_availability(
            terminal=terminal,
            date=date,
            gate=gate,
            auth_header=auth_header,
            request_id=trace_id[:8]
        )
        
        return standard_response(
            message=f"Found {len(slots)} available slots for terminal {terminal} on {date}",
            data={
                "terminal": terminal,
                "date": date,
                "gate": gate,
                "slots": slots,
                "total_count": len(slots)
            },
            trace_id=trace_id
        )
        
    except HTTPException as e:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Failed to get slot availability: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to retrieve slot availability"
        )


# ============================================================================
# Operator Analytics Endpoints (NEW)
# ============================================================================

@router.get("/ai-overview")
async def get_operator_ai_overview(
    request: Request,
    operator_id: str = Query(..., description="Operator identifier"),
    terminal: Optional[str] = Query(None, description="Terminal filter (A, B, C, etc.)"),
    days: int = Query(30, ge=7, le=90, description="Historical range in days"),
    bucket: str = Query("1h", description="Time bucket size (1h, 30m, etc.)"),
    use_llm: bool = Query(True, description="Use AGNO for narrative polishing")
):
    """
    Get AI operator analytics overview with BA-grade insights.
    
    **Features**:
    - Operator behavior pattern analysis
    - Capacity utilization assessment
    - Management score (0-100)
    - Planning quality (GOOD/RISK/CRITICAL)
    - Actionable recommendations
    
    **Requires**: ADMIN or OPERATOR role
    **REAL-ONLY Mode**: Requires backend analytics endpoints
    """
    require_operator_or_admin(request)
    trace_id = get_trace_id(request)
    auth_header = get_auth_header(request)
    user_role = get_role(request)
    
    logger.info(f"[{trace_id[:8]}] GET /operator/ai-overview operator_id={operator_id}")
    
    # Build context for agent
    context = {
        "operator_id": operator_id,
        "terminal": terminal,
        "range_days": days,
        "bucket": bucket,
        "use_llm": use_llm,
        "user_role": user_role,
        "auth_header": auth_header,
        "trace_id": trace_id,
        "message": f"Analyze operator {operator_id} performance",
        "entities": {"operator_id": operator_id, "terminal": terminal}
    }
    
    # Execute agent
    try:
        from app.agents.registry import get_agent
        
        agent = get_agent("OperatorAnalyticsAgent")
        result = await agent.execute(context)
        
        # Check for errors
        if result.get("data", {}).get("error"):
            error_type = result["data"].get("error_type", "unknown")
            
            if error_type == "RBACViolation":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=result["message"]
                )
            elif error_type == "BackendDependencyMissing":
                raise HTTPException(
                    status_code=status.HTTP_424_FAILED_DEPENDENCY,
                    detail=result["message"]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result["message"]
                )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Operator analytics failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/month-forecast")
async def get_month_forecast(
    request: Request,
    operator_id: str = Query(..., description="Operator identifier"),
    month: str = Query(..., description="Target month (YYYY-MM)", regex=r"^\d{4}-\d{2}$"),
    terminal: Optional[str] = Query(None, description="Terminal filter"),
    bucket: str = Query("1h", description="Time bucket size"),
    capacity_boost_pct: int = Query(0, ge=0, le=50, description="Capacity increase % for what-if simulation")
):
    """
    Forecast monthly throughput and identify high-risk windows.
    
    **Features**:
    - Time-series based forecasting (seasonal naive + EWMA)
    - Saturation risk scoring per slot
    - Month alignment score (0-100)
    - Planning quality assessment
    - What-if capacity boost simulation
    
    **Requires**: ADMIN or OPERATOR role
    **REAL-ONLY Mode**: Requires historical throughput and plan data
    """
    require_operator_or_admin(request)
    trace_id = get_trace_id(request)
    auth_header = get_auth_header(request)
    
    logger.info(f"[{trace_id[:8]}] GET /operator/month-forecast month={month}")
    
    # Import forecast engine
    from app.analytics import forecast_monthly_throughput, simulate_capacity_boost
    from app.tools.analytics_data_client import get_plan_slots, get_ops_throughput, BackendDependencyMissing
    from datetime import datetime, timedelta
    
    # Validate month format
    try:
        year, month_num = map(int, month.split('-'))
        target_month_start = datetime(year, month_num, 1)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format. Use YYYY-MM (e.g., 2026-03)"
        )
    
    # Calculate lookback period (8 weeks before target month)
    lookback_start = target_month_start - timedelta(weeks=8)
    lookback_end = target_month_start - timedelta(days=1)
    
    date_from = lookback_start.strftime("%Y-%m-%d")
    date_to = lookback_end.strftime("%Y-%m-%d")
    
    # Fetch backend data
    try:
        # Historical throughput
        historical_throughput = await get_ops_throughput(
            terminal=terminal,
            date_from=date_from,
            date_to=date_to,
            auth_header=auth_header,
            trace_id=trace_id,
            bucket=bucket
        )
        
        # Plan for target month
        month_start = target_month_start.strftime("%Y-%m-%d")
        if month_num == 12:
            month_end = datetime(year + 1, 1, 1).strftime("%Y-%m-%d")
        else:
            month_end = datetime(year, month_num + 1, 1).strftime("%Y-%m-%d")
        
        plan = await get_plan_slots(
            terminal=terminal,
            date_from=month_start,
            date_to=month_end,
            auth_header=auth_header,
            trace_id=trace_id,
            bucket=bucket
        )
        
    except BackendDependencyMissing as e:
        raise HTTPException(
            status_code=status.HTTP_424_FAILED_DEPENDENCY,
            detail=f"Backend data unavailable: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Failed to fetch forecast data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch forecast data: {str(e)}"
        )
    
    # Run forecast
    try:
        forecast_result = forecast_monthly_throughput(
            historical_throughput=historical_throughput,
            next_month=month,
            plan=plan,
            lookback_weeks=8
        )
        
        # What-if simulation
        if capacity_boost_pct > 0:
            simulation = simulate_capacity_boost(
                forecast_buckets=forecast_result["forecast_buckets"],
                plan=plan,
                boost_pct=capacity_boost_pct
            )
            forecast_result["simulation_results"] = simulation
        
        # Build response
        data = {
            "operator_id": operator_id,
            "terminal": terminal,
            **forecast_result
        }
        
        message = f"Forecast for {month}: {forecast_result['planning_quality']} planning quality (score: {forecast_result['month_alignment_score']}/100)"
        
        return standard_response(
            message=message,
            data=data,
            proofs={
                "trace_id": trace_id,
                "data_sources": ["analytics/ops/throughput", "analytics/plan/slots"],
                "methods": ["seasonal_naive", "ewma_smoothing", "saturation_risk"],
                "mode": "real"
            }
        )
        
    except Exception as e:
        logger.exception(f"[{trace_id[:8]}] Forecast computation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast computation failed: {str(e)}"
        )
