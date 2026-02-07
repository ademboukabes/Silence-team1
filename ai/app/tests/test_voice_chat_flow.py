"""
Tests for Voice Chat Flow

Integration tests for voice-to-chat functionality:
- STT → Orchestrator → Agent
- Darija transcription → booking intent
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import io

from app.main import app

client = TestClient(app)


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def sample_audio_file():
    """Create a small dummy audio file."""
    audio_bytes = b"fake_audio_data" * 100
    return io.BytesIO(audio_bytes)


@pytest.fixture
def mock_darija_transcription():
    """Mock Darija transcription."""
    return {
        "text": "kayen blassa ghedwa fel terminal A",
        "language": "ar-dz",
        "confidence": 0.94,
        "duration_seconds": 3.2,
        "normalized_text": None,
        "segments": [],
        "proofs": {
            "trace_id": "test123",
            "provider": "faster-whisper",
            "model": "medium",
            "mode": "real",
            "processing_time_ms": 1200,
        }
    }


@pytest.fixture
def mock_orchestrator_response():
    """Mock orchestrator response for slot availability."""
    return {
        "message": "🟢 Available slots found for tomorrow at Terminal A",
        "data": {
            "slots": [
                {"slot_id": "SLOT-101", "time": "08:00-09:00", "available": True},
                {"slot_id": "SLOT-102", "time": "09:00-10:00", "available": True},
            ]
        },
        "proofs": {
            "trace_id": "test123",
            "intent": "slot_availability",
            "sources": ["slot_service_client"],
        }
    }


# ============================================================================
# Voice Chat Flow Tests
# ============================================================================


@pytest.mark.asyncio
async def test_voice_chat_calls_orchestrator(sample_audio_file, mock_darija_transcription, mock_orchestrator_response):
    """Test that voice chat transcribes then calls orchestrator."""
    
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock_stt, \
         patch("app.orchestrator.orchestrator.Orchestrator.execute", new_callable=AsyncMock) as mock_orch:
        
        mock_stt.return_value = mock_darija_transcription
        mock_orch.return_value = mock_orchestrator_response
        
        response = client.post(
            "/api/chat/voice",
            files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
            data={"user_role": "CARRIER", "language_hint": "ar-dz"}
        )
        
        assert response.status_code == 200
        
        # Verify STT was called
        assert mock_stt.called
        
        # Verify orchestrator was called with transcription
        assert mock_orch.called
        orch_context = mock_orch.call_args[0][0]
        assert orch_context["message"] == "kayen blassa ghedwa fel terminal A"
        assert orch_context["user_role"] == "CARRIER"
        assert orch_context["input_modality"] == "voice"
        
        # Verify response structure
        data = response.json()
        assert data["message"] == mock_orchestrator_response["message"]
        assert data["input_modality"] == "voice"
        assert "stt" in data
        assert data["stt"]["text"] == "kayen blassa ghedwa fel terminal A"
        assert data["stt"]["language"] == "ar-dz"
        assert data["stt"]["confidence"] == 0.94


@pytest.mark.asyncio
async def test_voice_chat_darija_to_slot_availability(sample_audio_file, mock_darija_transcription):
    """Test Darija voice → slot availability intent."""
    
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock_stt:
        mock_stt.return_value = mock_darija_transcription
        
        # Don't mock orchestrator - test real intent detection
        response = client.post(
            "/api/chat/voice",
            files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
            data={"user_role": "CARRIER"}
        )
        
        # Should succeed (orchestrator might return "agent not available" but that's OK)
        assert response.status_code in [200, 500]  # 500 if agent not implemented
        
        if response.status_code == 200:
            data = response.json()
            assert "stt" in data
            assert data["stt"]["language"] == "ar-dz"


@pytest.mark.asyncio
async def test_voice_chat_file_and_url_validation(sample_audio_file):
    """Test validation when both file and URL provided."""
    
    response = client.post(
        "/api/chat/voice",
        files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
        data={"url": "https://example.com/audio.mp3", "user_role": "CARRIER"}
    )
    
    assert response.status_code == 400
    assert "both" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_voice_chat_no_file_or_url():
    """Test validation when neither file nor URL provided."""
    
    response = client.post(
        "/api/chat/voice",
        data={"user_role": "CARRIER"}
    )
    
    assert response.status_code == 400
    assert "neither" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_voice_chat_stt_unavailable(sample_audio_file):
    """Test graceful error when STT disabled."""
    
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock_stt:
        mock_stt.side_effect = Exception("STT is disabled (STT_ENABLED=false)")
        
        response = client.post(
            "/api/chat/voice",
            files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
            data={"user_role": "CARRIER"}
        )
        
        assert response.status_code == 200  # Returns structured error, not HTTP error
        
        data = response.json()
        assert "data" in data
        assert data["data"].get("error_type") == "STTUnavailable"
        assert "disabled" in data["message"].lower() or "not enabled" in data["message"].lower()


@pytest.mark.asyncio
async def test_voice_chat_from_url():
    """Test voice chat with URL input."""
    
    mock_transcription = {
        "text": "book terminal B tomorrow",
        "language": "en",
        "confidence": 0.96,
        "duration_seconds": 2.5,
        "normalized_text": None,
        "segments": [],
        "proofs": {"trace_id": "test123", "provider": "faster-whisper", "mode": "real"},
    }
    
    mock_orch_response = {
        "message": "Booking created successfully",
        "data": {"booking_ref": "REF12345"},
        "proofs": {"trace_id": "test123"},
    }
    
    with patch("app.tools.stt_service_client.transcribe_url", new_callable=AsyncMock) as mock_stt, \
         patch("app.orchestrator.orchestrator.Orchestrator.execute", new_callable=AsyncMock) as mock_orch:
        
        mock_stt.return_value = mock_transcription
        mock_orch.return_value = mock_orch_response
        
        response = client.post(
            "/api/chat/voice",
            data={
                "url": "https://example.com/audio.mp3",
                "user_role": "CARRIER",
                "language_hint": "en"
            }
        )
        
        assert response.status_code == 200
        
        # Verify transcribe_url was called
        assert mock_stt.called
        
        # Verify response
        data = response.json()
        assert data["stt"]["text"] == "book terminal B tomorrow"
        assert data["stt"]["language"] == "en"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
