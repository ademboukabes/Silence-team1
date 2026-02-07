"""
STT Schemas

Pydantic models for STT request/response validation.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any


class TranscribeResponse(BaseModel):
    """Response from STT transcription."""
    text: str = Field(description="Transcribed text")
    language: str = Field(description="Detected language (ar-dz, ar, fr, etc.)")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score")
    duration_seconds: float = Field(description="Audio duration in seconds")
    normalized_text: Optional[str] = Field(None, description="Normalized text (if requested)")
    segments: Optional[List[Dict[str, Any]]] = Field(None, description="Detailed segments")
    proofs: Dict[str, Any] = Field(description="Processing metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "kayen blassa ghedwa fel terminal A",
                "language": "ar-dz",
                "confidence": 0.94,
                "duration_seconds": 3.2,
                "normalized_text": "كاين بلاصة غدوة في terminal A",
                "segments": [
                    {"start": 0.0, "end": 1.5, "text": "kayen blassa"},
                    {"start": 1.5, "end": 3.2, "text": "ghedwa fel terminal A"}
                ],
                "proofs": {
                    "trace_id": "abc123",
                    "provider": "faster-whisper",
                    "model": "medium",
                    "processing_time_ms": 1250
                }
            }
        }


class TranscribeURLRequest(BaseModel):
    """Request to transcribe audio from URL."""
    url: HttpUrl = Field(description="URL to audio file")
    language_hint: str = Field("auto", description="Language hint for transcription")
    normalize: bool = Field(False, description="Apply Darija normalization")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com/audio.mp3",
                "language_hint": "ar-dz",
                "normalize": False
            }
        }


class STTHealthResponse(BaseModel):
    """STT service health status."""
    enabled: bool = Field(description="Whether STT is enabled")
    provider: str = Field(description="STT provider name")
    model_name: Optional[str] = Field(None, description="Model identifier")
    mode: str = Field(description="Operation mode (real|mvp)")
    ready: bool = Field(description="Whether service is ready")
    error: Optional[str] = Field(None, description="Error message if not ready")
    
    class Config:
        json_schema_extra = {
            "example": {
                "enabled": True,
                "provider": "local_whisper",
                "model_name": "medium",
                "mode": "real",
                "ready": True,
                "error": None
            }
        }


class VoiceChatRequest(BaseModel):
    """Request for voice chat (used internally)."""
    audio_bytes: bytes
    filename: str
    language_hint: str = "auto"
    user_role: str = "CARRIER"
    user_id: Optional[str] = None
    trace_id: Optional[str] = None


class VoiceChatResponse(BaseModel):
    """Response from voice chat endpoint."""
    message: str = Field(description="Agent response message")
    data: Dict[str, Any] = Field(description="Response data")
    proofs: Dict[str, Any] = Field(description="Tracing and proof metadata")
    stt: Dict[str, Any] = Field(description="STT metadata")
    input_modality: str = Field("voice", description="Input modality")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "✅ Availability found for tomorrow",
                "data": {"slots": []},
                "proofs": {"trace_id": "abc123"},
                "stt": {
                    "text": "kayen blassa ghedwa",
                    "language": "ar-dz",
                    "confidence": 0.92,
                    "duration_seconds": 2.1
                },
                "input_modality": "voice"
            }
        }

