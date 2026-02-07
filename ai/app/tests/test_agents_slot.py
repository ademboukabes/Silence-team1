"""
Tests for SlotAgent (slot availability and recommendation).
"""
import pytest
from unittest.mock import AsyncMock
from app.agents.slot_agent import SlotAgent


class TestSlotAgent:
    """Test SlotAgent functionality."""
    
    async def test_slot_availability_request(self, mock_slot_service):
        """Test SlotAgent handles availability check."""
        agent = SlotAgent()
        
        context = {
            "message": "Is there availability terminal A tomorrow?",
            "entities": {
                "terminal": "A",
                "date_tomorrow": True,
                "intent": "check_availability"
            },
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        assert "data" in result
        # Should return slot data
        assert "terminal" in result["data"] or "slots" in result["data"] or "availability" in result["data"]
    
    async def test_slot_recommendation_uses_algorithm(self, mock_slot_service):
        """Test that SlotAgent uses slot_recommender for recommendations."""
        agent = SlotAgent()
        
        context = {
            "message": "Recommend best slot for terminal A",
            "entities": {
                "terminal": "A",
                "date": "2026-02-10",
                "carrier_id": "123",
                "intent": "recommend_slot"
            },
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        assert "data" in result
        # Should have recommendation data
        assert "recommended" in result["data"] or "slots" in result["data"]
    
    async def test_service_unavailable_fallback(self, monkeypatch):
        """Test SlotAgent handles service unavailability gracefully."""
        from app.tools import slot_service_client
        from fastapi import HTTPException, status
        
        async def mock_unavailable(*args, **kwargs):
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service down")
        
        monkeypatch.setattr(slot_service_client, "get_availability", mock_unavailable)
        
        agent = SlotAgent()
        context = {
            "message": "Check availability",
            "entities": {"terminal": "A", "date": "2026-02-10"},
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-123",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "message" in result
        assert "data" in result
        # Should have error indication
        assert result["data"].get("error") or result["data"].get("status_code")
    
    async def test_returns_proofs_with_trace(self, mock_slot_service):
        """Test that SlotAgent returns proofs with trace_id."""
        agent = SlotAgent()
        
        context = {
            "message": "availability",
            "entities": {"terminal": "A", "date": "2026-02-10"},
            "history": [],
            "user_role": "CARRIER",
            "user_id": 1,
            "trace_id": "test-trace-abc",
            "auth_header": "Bearer test-token"
        }
        
        result = await agent.execute(context)
        
        assert "proofs" in result
        assert "trace_id" in result["proofs"]
