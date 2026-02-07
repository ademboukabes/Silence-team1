"""
Test Suite for Booking Creation Feature

Comprehensive integration tests for:
- Direct booking with slot_id
- Smart booking with slot recommendation
- Error handling and edge cases
- RBAC enforcement

Run with: pytest app/tests/test_booking_create.py -v
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date, timedelta


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def mock_auth_header():
    """Valid Authorization header."""
    return "Bearer test-token-1234567890"


@pytest.fixture
def mock_trace_id():
    """Sample trace ID."""
    return "test-trace-id-12345678"


@pytest.fixture
def booking_context_direct(mock_auth_header, mock_trace_id):
    """Context for direct booking (with slot_id)."""
    return {
        "message": "Book slot SLOT-123 at terminal A tomorrow",
        "entities": {
            "terminal": "A",
            "date_tomorrow": True,
            "slot_id": "SLOT123",
        },
        "history": [],
        "user_role": "CARRIER",
        "user_id": "carrier_456",
        "trace_id": mock_trace_id,
        "auth_header": mock_auth_header
    }


@pytest.fixture
def booking_context_smart(mock_auth_header, mock_trace_id):
    """Context for smart booking (without slot_id)."""
    return {
        "message": "Book terminal A tomorrow",
        "entities": {
            "terminal": "A",
            "date_tomorrow": True,
            "carrier_id": "456"
        },
        "history": [],
        "user_role": "CARRIER",
        "user_id": "carrier_456",
        "trace_id": mock_trace_id,
        "auth_header": mock_auth_header
    }


@pytest.fixture
def mock_available_slots():
    """Sample available slots from slot service."""
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    return [
        {
            "slot_id": "SLOT-101",
            "start": f"{tomorrow} 08:00:00",
            "end": f"{tomorrow} 09:00:00",
            "capacity": 10,
            "remaining": 5,
            "terminal": "A",
            "gate": "G1"
        },
        {
            "slot_id": "SLOT-102",
            "start": f"{tomorrow} 09:00:00",
            "end": f"{tomorrow} 10:00:00",
            "capacity": 10,
            "remaining": 8,
            "terminal": "A",
            "gate": "G1"
        },
        {
            "slot_id": "SLOT-103",
            "start": f"{tomorrow} 10:00:00",
            "end": f"{tomorrow} 11:00:00",
            "capacity": 10,
            "remaining": 2,
            "terminal": "A",
            "gate": "G2"
        }
    ]


@pytest.fixture
def mock_booking_response():
    """Sample booking response from backend."""
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    return {
        "booking_ref": "REF12345",
        "status": "confirmed",
        "terminal": "A",
        "gate": "G1",
        "slot_id": "SLOT-102",
        "slot_time": f"{tomorrow} 09:00:00",
        "last_update": date.today().isoformat() + " 04:45:00"
    }





# ============================================================================
# Test Cases
# ============================================================================


class TestBookingCreateAgent:
    """Test suite for BookingCreateAgent."""

    @pytest.mark.asyncio
    async def test_direct_booking_success(
        self,
        booking_context_direct,
        mock_booking_response,
    ):
        """
        Test Case 1: Direct booking with slot_id succeeds.
        
        Scenario:
        - User provides slot_id explicitly
        - Backend booking service is available
        - Booking is created successfully
        
        Expected:
        - Agent calls booking_write_client.create_booking() directly
        - No slot recommendation needed
        - Returns success message with booking_ref
        """
        from app.agents.booking_create_agent import BookingCreateAgent
        
        agent = BookingCreateAgent()
        
        with patch("app.tools.booking_write_client.create_booking", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_booking_response
            
            result = await agent.run(booking_context_direct)
            
            # Verify booking created
            assert mock_create.called
            assert mock_create.call_count == 1
            
            # Verify correct payload
            call_args = mock_create.call_args
            payload = call_args.kwargs["payload"]
            assert payload["terminal"] == "A"
            assert payload["slot_id"] == "SLOT123"
            tomorrow = (date.today() + timedelta(days=1)).isoformat()
            assert payload["date"] == tomorrow
            
            # Verify response structure
            assert "message" in result
            assert "data" in result
            assert "proofs" in result
            
            # Verify booking data
            assert result["data"]["booking_ref"] == "REF12345"
            assert result["data"]["status"] == "confirmed"
            assert result["data"]["strategy"] == "direct"
            
            # Verify message content
            assert "REF12345" in result["message"]
            assert "✅" in result["message"]



    @pytest.mark.asyncio
    async def test_validation_error_missing_terminal(
        self,
        mock_auth_header,
        mock_trace_id
    ):
        """
        Test Case 3: Validation error when terminal is missing.
        
        Scenario:
        - User request doesn't include terminal
        - Agent detects missing required field
        
        Expected:
        - Returns validation error
        - Provides helpful suggestion
        - No backend calls made
        """
        from app.agents.booking_create_agent import BookingCreateAgent
        
        agent = BookingCreateAgent()
        
        context = {
            "message": "Book tomorrow",  # No terminal
            "entities": {
                "date_tomorrow": True
            },
            "history": [],
            "user_role": "CARRIER",
            "trace_id": mock_trace_id,
            "auth_header": mock_auth_header
        }
        
        with patch("app.tools.booking_write_client.create_booking", new_callable=AsyncMock) as mock_create:
            result = await agent.run(context)
            
            # Verify no backend call
            assert not mock_create.called
            
            # Verify error message
            assert "message" in result
            assert "terminal" in result["message"].lower()
            assert "Terminal A" in result["message"]  # Example suggestion

    @pytest.mark.asyncio
    async def test_unauthorized_without_auth_header(
        self,
        mock_trace_id
    ):
        """
        Test Case 4: Unauthorized when auth header is missing.
        
        Scenario:
        - User is not authenticated (no auth header)
        - Agent requires authentication for booking creation
        
        Expected:
        - Returns error response
        - Message explains authentication is required
        - No backend calls made
        """
        from app.agents.booking_create_agent import BookingCreateAgent
        
        agent = BookingCreateAgent()
        
        context = {
            "message": "Book terminal A tomorrow",
            "entities": {
                "terminal": "A",
                "date_tomorrow": True
            },
            "history": [],
            "user_role": "GUEST",  # Not authenticated
            "trace_id": mock_trace_id,
            "auth_header": None  # NO AUTH
        }
        
        with patch("app.tools.booking_write_client.create_booking", new_callable=AsyncMock) as mock_create:
            result = await agent.run(context)
            
            # Verify no backend call
            assert not mock_create.called
            
            # Verify error message
            assert "message" in result
            assert "authentication" in result["message"].lower() or "login" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_mvp_fallback_slot_service_unavailable(
        self,
        booking_context_smart,
        mock_auth_header
    ):
        """
        Test Case 5: MVP fallback when slot service is unavailable.
        
        Scenario:
        - User doesn't provide slot_id (needs recommendation)
        - Slot service returns 404 (endpoint missing)
        - Agent provides MVP fallback message
        
        Expected:
        - Catches HTTPException
        - Detects endpoint is missing via is_endpoint_missing()
        - Returns helpful message explaining workaround
        """
        from app.agents.booking_create_agent import BookingCreateAgent
        from fastapi import HTTPException, status
        
        agent = BookingCreateAgent()
        
        with patch("app.tools.slot_service_client.get_availability", new_callable=AsyncMock) as mock_avail, \
             patch("app.tools.slot_service_client.is_endpoint_missing") as mock_is_missing:
            
            # Simulate endpoint not found
            mock_avail.side_effect = HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Endpoint not available"
            )
            mock_is_missing.return_value = True
            
            result = await agent.run(booking_context_smart)
            
            # Verify fallback message
            assert "message" in result
            assert "data" in result
            assert result["data"].get("error") == "slot_service_unavailable"
            
            # Verify workaround is mentioned
            assert "slot ID" in result["message"] or "SLOT-" in result["message"]
            assert "workaround" in result["data"]

    @pytest.mark.asyncio
    async def test_no_available_slots(
        self,
        booking_context_smart
    ):
        """
        Test Case 6: Error when no slots are available.
        
        Scenario:
        - Slot service returns empty list (no availability)
        - Agent can't proceed with booking
        
        Expected:
        - Returns error explaining no availability
        - Suggests trying different date/terminal
        """
        from app.agents.booking_create_agent import BookingCreateAgent
        
        agent = BookingCreateAgent()
        
        with patch("app.tools.slot_service_client.get_availability", new_callable=AsyncMock) as mock_avail:
            mock_avail.return_value = []  # No slots available
            
            result = await agent.run(booking_context_smart)
            
            # Verify error message
            assert "message" in result
            assert "no available slots" in result["message"].lower() or "not found" in result["message"].lower()
            
            # Verify terminal and date mentioned
            assert "A" in result["message"]  # Terminal


# ============================================================================
# Orchestrator Integration Tests
# ============================================================================


class TestOrchestratorBookingCreateIntent:
    """Test booking_create intent detection and routing."""

    @pytest.mark.asyncio
    async def test_intent_detection_book_terminal(self):
        """
        Test intent detection for "book terminal X" queries.
        """
        from app.orchestrator.orchestrator import Orchestrator
        
        orchestrator = Orchestrator()
        
        # Test various phrasings
        test_cases = [
            "Book terminal A tomorrow",
            "Reserve terminal B today",
            "Create a booking for terminal C",
            "I need to book a slot at terminal A",
            "Make a reservation at terminal B tomorrow"
        ]
        
        for message in test_cases:
            intent = orchestrator._detect_intent(message, [])
            assert intent == "booking_create", f"Failed for: {message}"

    @pytest.mark.asyncio
    async def test_intent_priority_booking_create_vs_status(self):
        """
        Test that booking_create has higher priority than booking_status
        for ambiguous queries.
        """
        from app.orchestrator.orchestrator import Orchestrator
        
        orchestrator = Orchestrator()
        
        # "book" keyword should trigger booking_create, not booking_status
        message = "Book terminal A tomorrow"
        intent = orchestrator._detect_intent(message, [])
        assert intent == "booking_create"
        
        # But "status of booking" should still be booking_status
        message = "What's the status of my booking REF123?"
        intent = orchestrator._detect_intent(message, [])
        assert intent == "booking_status"

    @pytest.mark.asyncio
    async def test_entity_extraction_slot_id(self):
        """
        Test slot_id entity extraction.
        """
        from app.orchestrator.orchestrator import Orchestrator
        
        orchestrator = Orchestrator()
        
        test_cases = [
            ("Book SLOT-123 at terminal A", "SLOT-123"),
            ("I want slot slot-456", "SLOT-456"),
            ("Reserve SLOT789", "SLOT789"),
        ]
        
        for message, expected_slot_id in test_cases:
            entities = orchestrator._extract_entities(message)
            assert "slot_id" in entities, f"No slot_id extracted from: {message}"
            assert entities["slot_id"] == expected_slot_id, f"Wrong slot_id for: {message}"

    @pytest.mark.asyncio
    async def test_entity_extraction_carrier_id(self):
        """
        Test carrier_id entity extraction.
        """
        from app.orchestrator.orchestrator import Orchestrator
        
        orchestrator = Orchestrator()
        
        test_cases = [
            ("Book for carrier 456", "456"),
            ("Carrier-789 needs a booking", "789"),
            ("CARRIER 123 tomorrow", "123"),
        ]
        
        for message, expected_carrier_id in test_cases:
            entities = orchestrator._extract_entities(message)
            assert "carrier_id" in entities, f"No carrier_id extracted from: {message}"
            assert entities["carrier_id"] == expected_carrier_id, f"Wrong carrier_id for: {message}"

    @pytest.mark.asyncio
    async def test_rbac_booking_create_carrier_allowed(self):
        """
        Test that CARRIER role has booking_create permission.
        """
        from app.orchestrator.orchestrator import ROLE_PERMISSIONS
        
        assert "booking_create" in ROLE_PERMISSIONS["CARRIER"]

    @pytest.mark.asyncio
    async def test_rbac_booking_create_admin_allowed(self):
        """
        Test that ADMIN role has booking_create permission.
        """
        from app.orchestrator.orchestrator import ROLE_PERMISSIONS
        
        assert "booking_create" in ROLE_PERMISSIONS["ADMIN"]


# ============================================================================
# Helper Function Tests
# ============================================================================


class TestBookingWriteClient:
    """Test booking_write_client functions."""

    @pytest.mark.asyncio
    async def test_create_booking_normalizes_response(self):
        """
        Test that create_booking normalizes backend response correctly.
        """
        from app.tools import booking_write_client
        
        # Mock the httpx client
        with patch.object(booking_write_client, "get_client") as mock_get_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": {
                    "bookingRef": "REF12345",  # Different field name
                    "status": "confirmed",
                    "terminalId": "A",  # Different field name
                    "gateId": "G1",
                    "slotId": "SLOT-123",
                    "slotTime": "2026-02-08 09:00:00",
                    "updatedAt": "2026-02-06 04:45:00"
                }
            }
            mock_response.raise_for_status = MagicMock()
            
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client
            
            result = await booking_write_client.create_booking(
                payload={"terminal": "A", "slot_id": "SLOT-123", "date": "2026-02-08"},
                auth_header="Bearer test"
            )
            
            # Verify normalization
            assert result["booking_ref"] == "REF12345"
            assert result["terminal"] == "A"
            assert result["gate"] == "G1"
            assert result["slot_id"] == "SLOT-123"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
