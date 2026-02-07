"""
Tests for STT API Routes

Unit tests for STT transcription endpoints, validation, health checks, and MVP mode.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import io

from app.main import app
from app.constants.stt_constants import AUDIO_MAX_MB

client = TestClient(app)


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def mock_stt_transcribe_success():
    """Mock successful STT transcription."""
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock:
        mock.return_value = {
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
        yield mock


@pytest.fixture
def mock_stt_mvp_mode():
    """Mock STT in MVP dummy mode."""
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "text": "kayen blassa ghedwa?",
            "language": "ar-dz",
            "confidence": 1.0,
            "duration_seconds": 2.0,
            "normalized_text": None,
            "segments": [],
            "proofs": {
                "trace_id": "test123",
                "provider": "mvp_dummy",
                "model": "none",
                "mode": "mvp",
                "note": "dummy transcription for development",
                "processing_time_ms": 0,
            }
        }
        yield mock


@pytest.fixture
def mock_stt_disabled():
    """Mock STT disabled."""
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock) as mock:
        mock.side_effect = Exception("STT is disabled (STT_ENABLED=false)")
        yield mock


@pytest.fixture
def sample_audio_file():
    """Create a small dummy audio file."""
    # Create a tiny mp3-like byte stream (not a real mp3, just for testing)
    audio_bytes = b"fake_audio_data_for_testing" * 100
    return io.BytesIO(audio_bytes)


# ============================================================================
# Validation Tests
# ============================================================================


def test_transcribe_missing_file():
    """Test 400 error when file not provided."""
    response = client.post(
        "/api/stt/transcribe",
        data={"language_hint": "auto"}
    )
    
    assert response.status_code == 422  # FastAPI validation error


def test_transcribe_file_too_large(sample_audio_file):
    """Test 400 error when file too large."""
    # Create a file larger than 15MB
    large_data = b"x" * (AUDIO_MAX_MB * 1024 * 1024 + 1000)
    large_file = io.BytesIO(large_data)
    
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock):
        response = client.post(
            "/api/stt/transcribe",
            files={"file": ("large_audio.mp3", large_file, "audio/mpeg")},
            data={"language_hint": "auto"}
        )
    
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


def test_transcribe_unsupported_format():
    """Test 400 error for unsupported file format."""
    fake_file = io.BytesIO(b"fake data")
    
    response = client.post(
        "/api/stt/transcribe",
        files={"file": ("document.pdf", fake_file, "application/pdf")},
        data={"language_hint": "auto"}
    )
    
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()


def test_transcribe_invalid_language_hint(sample_audio_file):
    """Test 400 error for invalid language hint."""
    with patch("app.tools.stt_service_client.transcribe_bytes", new_callable=AsyncMock):
        response = client.post(
            "/api/stt/transcribe",
            files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
            data={"language_hint": "invalid_lang"}
        )
    
    assert response.status_code == 400
    assert "invalid language" in response.json()["detail"].lower()


# ============================================================================
# Successful Transcription Tests
# ============================================================================


def test_transcribe_success(sample_audio_file, mock_stt_transcribe_success):
    """Test successful transcription."""
    response = client.post(
        "/api/stt/transcribe",
        files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
        data={"language_hint": "ar-dz", "normalize": "false"}
    )
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["text"] == "kayen blassa ghedwa fel terminal A"
    assert data["language"] == "ar-dz"
    assert data["confidence"] == 0.94
    assert data["duration_seconds"] == 3.2
    assert data["proofs"]["provider"] == "faster-whisper"
    
    # Verify service client was called
    assert mock_stt_transcribe_success.called


def test_transcribe_text_format(sample_audio_file, mock_stt_transcribe_success):
    """Test transcription with text format response."""
    response = client.post(
        "/api/stt/transcribe",
        files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
        data={"language_hint": "auto", "format": "text"}
    )
    
    assert response.status_code == 200
    
    data = response.json()
    assert "text" in data
    assert data["text"] == "kayen blassa ghedwa fel terminal A"


def test_transcribe_mvp_mode(sample_audio_file, mock_stt_mvp_mode):
    """Test transcription in MVP dummy mode."""
    response = client.post(
        "/api/stt/transcribe",
        files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
        data={"language_hint": "auto"}
    )
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["proofs"]["mode"] == "mvp"
    assert data["proofs"]["provider"] == "mvp_dummy"
    assert "dummy" in data["proofs"].get("note", "").lower()


# ============================================================================
# Error Handling Tests
# ============================================================================


def test_transcribe_stt_disabled(sample_audio_file, mock_stt_disabled):
    """Test 503 error when STT disabled."""
    response = client.post(
        "/api/stt/transcribe",
        files={"file": ("audio.mp3", sample_audio_file, "audio/mpeg")},
        data={"language_hint": "auto"}
    )
    
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()


def test_transcribe_url_invalid_url():
    """Test error for invalid URL."""
    with patch("app.tools.stt_service_client.transcribe_url", new_callable=AsyncMock) as mock:
        mock.side_effect = Exception("Failed to download audio: 404")
        
        response = client.post(
            "/api/stt/transcribe-url",
            json={
                "url": "https://example.com/nonexistent.mp3",
                "language_hint": "auto",
                "normalize": False
            }
        )
    
    assert response.status_code == 400
    assert "download" in response.json()["detail"].lower()


# ============================================================================
# Health Check Tests
# ============================================================================


def test_health_check_enabled():
    """Test health check when STT enabled."""
    with patch("app.tools.stt_service_client.get_health", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "enabled": True,
            "provider": "local_whisper",
            "model_name": "medium",
            "mode": "real",
            "ready": True,
            "error": None,
        }
        
        response = client.get("/api/stt/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["enabled"] is True
    assert data["provider"] == "local_whisper"
    assert data["mode"] == "real"
    assert data["ready"] is True


def test_health_check_disabled():
    """Test health check when STT disabled."""
    with patch("app.tools.stt_service_client.get_health", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "enabled": False,
            "provider": "none",
            "model_name": None,
            "mode": "disabled",
            "ready": False,
            "error": "STT is disabled",
        }
        
        response = client.get("/api/stt/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["enabled"] is False
    assert data["mode"] == "disabled"


def test_health_check_mvp_mode():
    """Test health check in MVP mode."""
    with patch("app.tools.stt_service_client.get_health", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "enabled": True,
            "provider": "mvp_dummy",
            "model_name": "none",
            "mode": "mvp",
            "ready": True,
            "error": None,
        }
        
        response = client.get("/api/stt/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["mode"] == "mvp"
    assert data["provider"] == "mvp_dummy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
