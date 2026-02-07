"""
Tests for BookingAgent (booking status retrieval).
"""
import pytest
from app.agents.booking_agent import BookingAgent


class TestBookingAgent:
    """Test BookingAgent functionality."""
    
    async def test_booking_status_retrieval(self, mock_booking_service):
        """Test BookingAgent retrieves booking status."""
        agent = BookingAgent()
        
        context = {
            "message": "What's the status of REF123?",
            "entities": {"booking_ref": "REF123"},
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        assert "data" in result
        assert "proofs" in result
        
        # Should contain booking data
        assert "booking_ref" in result["data"] or "status" in result["data"]
    
    async def test_missing_booking_ref_returns_error(self):
        """Test that missing booking_ref returns validation error."""
        agent = BookingAgent()
        
        context = {
            "message": "check my booking",
            "entities": {},  # No booking_ref!
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        # Should explain booking_ref is missing
        assert "booking" in result["message"].lower() and ("ref" in result["message"].lower() or "reference" in result["message"].lower())
    
    async def test_unauthorized_without_auth(self):
        """Test that missing auth_header returns error."""
        agent = BookingAgent()
        
        context = {
            "message": "status REF123",
            "entities": {"booking_ref": "REF123"},
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            # No auth_header
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        # Should indicate auth issue
        assert "auth" in result["message"].lower() or "login" in result["message"].lower()
    
    async def test_service_error_handled(self, monkeypatch):
        """Test that service errors are handled gracefully."""
        from app.tools import booking_service_client
        from fastapi import HTTPException, status
        
        async def mock_service_error(*args, **kwargs):
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service down")
        
        monkeypatch.setattr(booking_service_client, "get_booking_status", mock_service_error)
        
        agent = BookingAgent()
        context = {
            "message": "status REF123",
            "entities": {"booking_ref": "REF123"},
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        assert "data" in result
        # Should have error indicator
        assert result["data"].get("error") or result["data"].get("status_code")
