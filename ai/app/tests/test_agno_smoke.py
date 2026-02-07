"""
AGNO Runtime Smoke Tests

Tests for AGNO integration with orchestrator.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock


# ============================================================================
# AGNO Availability Tests
# ============================================================================

def test_agno_config_loads():
    """Test that AGNO config loads without errors"""
    from app.agno_runtime.config import get_settings
    
    settings = get_settings()
    assert settings is not None
    assert hasattr(settings, "llm_model_name")
    assert hasattr(settings, "llm_temperature")


def test_agno_enabled_check():
    """Test AGNO enabled check"""
    from app.agno_runtime.config import is_agno_enabled
    
    # Should return bool
    result = is_agno_enabled()
    assert isinstance(result, bool)


# ============================================================================
# Intent Classification Tests
# ============================================================================

@pytest.mark.asyncio
async def test_intent_classifier_unknown_fallback():
    """Test that intent classifier falls back to unknown on error"""
    from app.agno_runtime.intent_classifier import classify_intent
    
    # Mock LLM to raise error
    with patch("app.agno_runtime.intent_classifier.llm_complete", side_effect=Exception("LLM error")):
        result = await classify_intent("test message", [], "test-trace")
        
        assert result["intent"] == "unknown"
        assert result["confidence"] == 0.0
        assert isinstance(result["entities"], dict)


@pytest.mark.asyncio
async def test_intent_classifier_json_parsing():
    """Test intent classifier JSON parsing"""
    from app.agno_runtime.intent_classifier import classify_intent
    
    # Mock LLM to return valid JSON
    mock_response = '{"intent": "booking_status", "entities": {"booking_ref": "BK123"}, "confidence": 0.9}'
    
    with patch("app.agno_runtime.intent_classifier.llm_complete", return_value=mock_response):
        result = await classify_intent("status of BK123", [], "test-trace")
        
        assert result["intent"] == "booking_status"
        assert result["entities"]["booking_ref"] == "BK123"
        assert result["confidence"] == 0.9


@pytest.mark.asyncio
async def test_intent_classifier_low_confidence():
    """Test that low confidence returns unknown"""
    from app.agno_runtime.intent_classifier import classify_intent
    
    # Mock LLM to return low confidence
    mock_response = '{"intent": "booking_status", "entities": {}, "confidence": 0.3}'
    
    with patch("app.agno_runtime.intent_classifier.llm_complete", return_value=mock_response):
        result = await classify_intent("test", [], "test-trace")
        
        # Should return unknown due to low confidence
        assert result["intent"] == "unknown"
        assert result["confidence"] == 0.3


# ============================================================================
# Message Polisher Tests
# ============================================================================

@pytest.mark.asyncio
async def test_message_polisher_fallback():
    """Test message polisher falls back to original on error"""
    from app.agno_runtime.message_polisher import polish_message
    
    agent_response = {
        "message": "Original message",
        "data": {},
        "proofs": {}
    }
    
    # Mock LLM to raise error
    with patch("app.agno_runtime.message_polisher.llm_complete", side_effect=Exception("LLM error")):
        result = await polish_message("user message", agent_response, "test-trace")
        
        # Should return original message
        assert result == "Original message"


# ============================================================================
# Orchestrator Integration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_orchestrator_agno_fallback_to_deterministic():
    """Test orchestrator falls back to deterministic when AGNO fails"""
    from app.orchestrator.orchestrator import Orchestrator
    
    orchestrator = Orchestrator()
    
    # Mock AGNO to fail
    with patch("app.agno_runtime.is_agno_enabled", return_value=True), \
         patch("app.agno_runtime.classify_intent", side_effect=Exception("AGNO error")):
        
        result = await orchestrator.handle_message(
            message="help",
            history=[],
            user_role="CARRIER",
            user_id=1,
            context={}
        )
        
        # Should still work with deterministic fallback
        assert "message" in result
        assert result["intent"] == "help"


@pytest.mark.asyncio
async def test_orchestrator_force_deterministic():
    """Test force_deterministic flag bypasses AGNO"""
    from app.orchestrator.orchestrator import Orchestrator
    
    orchestrator = Orchestrator()
    
    # Even if AGNO is enabled, force_deterministic should bypass it
    with patch("app.agno_runtime.is_agno_enabled", return_value=True):
        result = await orchestrator.handle_message(
            message="help",
            history=[],
            user_role="CARRIER",
            user_id=1,
            context={"force_deterministic": True}
        )
        
        assert "message" in result
        assert result["intent"] == "help"
        # Should not have AGNO in decision path
        decision_path = result.get("proofs", {}).get("decision_path", [])
        agno_steps = [step for step in decision_path if "agno" in step.lower()]
        assert len(agno_steps) == 0


@pytest.mark.asyncio
async def test_orchestrator_unknown_intent():
    """Test orchestrator handles unknown intent"""
    from app.orchestrator.orchestrator import Orchestrator
    
    orchestrator = Orchestrator()
    
    result = await orchestrator.handle_message(
        message="asdfghjkl qwerty",  # Gibberish
        history=[],
        user_role="CARRIER",
        user_id=1,
        context={"force_deterministic": True}
    )
    
    assert "message" in result
    assert result["intent"] == "unknown"
    assert "help" in result["message"].lower() or "understand" in result["message"].lower()


@pytest.mark.asyncio
async def test_orchestrator_booking_status_intent():
    """Test orchestrator routes booking_status intent"""
    from app.orchestrator.orchestrator import Orchestrator
    
    orchestrator = Orchestrator()
    
    # Mock BookingStatusAgent
    with patch("app.agents.booking_status_agent.BookingStatusAgent") as MockAgent:
        mock_instance = AsyncMock()
        mock_instance.run = AsyncMock(return_value={
            "message": "Booking found",
            "data": {"status": "confirmed"},
            "proofs": {}
        })
        MockAgent.return_value = mock_instance
        
        result = await orchestrator.handle_message(
            message="status of REF123",
            history=[],
            user_role="CARRIER",
            user_id=1,
            context={"force_deterministic": True}
        )
        
        assert "message" in result
        assert result["intent"] == "booking_status"


# ============================================================================
# LLM Provider Tests
# ============================================================================

@pytest.mark.asyncio
async def test_llm_provider_timeout():
    """Test LLM provider handles timeout"""
    from app.agno_runtime.llm_provider import llm_complete
    
    # Mock genai to timeout
    with patch("app.agno_runtime.llm_provider.genai.GenerativeModel") as MockModel:
        mock_model = MagicMock()
        mock_model.generate_content = MagicMock(side_effect=Exception("Timeout"))
        MockModel.return_value = mock_model
        
        with pytest.raises(Exception, match="LLM request failed"):
            await llm_complete("test prompt", trace_id="test-trace")


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
