"""
STT API Router

Endpoints for speech-to-text transcription:
- POST /api/stt/transcribe - Upload audio file
- POST /api/stt/transcribe-url - Transcribe from URL
- GET /api/stt/health - Service health check
"""

import logging
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse

from app.schemas.stt import TranscribeResponse, TranscribeURLRequest, STTHealthResponse
from app.constants.stt_constants import (
    AUDIO_MAX_BYTES,
    SUPPORTED_AUDIO_MIME,
    SUPPORTED_AUDIO_EXTENSIONS,
    STT_LANG_HINTS,
    DEFAULT_LANGUAGE_HINT,
    ERROR_MESSAGES,
)
from app.tools import stt_service_client

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# Validation Helpers
# ============================================================================


def validate_audio_file(file: UploadFile) -> None:
    """
    Validate uploaded audio file.
    
    Args:
        file: Uploaded file
    
    Raises:
        HTTPException: If validation fails
    """
    # Check if file provided
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["no_file"]
        )
    
    # Check file size
    if file.size and file.size > AUDIO_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["file_too_large"]
        )
    
    # Check MIME type
    if file.content_type and file.content_type not in SUPPORTED_AUDIO_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["unsupported_format"]
        )
    
    # Check file extension
    ext = Path(file.filename).suffix.lower()
    if ext and ext not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["unsupported_format"]
        )


def validate_language_hint(language_hint: str) -> None:
    """
    Validate language hint.
    
    Args:
        language_hint: Language hint
    
    Raises:
        HTTPException: If invalid
    """
    if language_hint not in STT_LANG_HINTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["invalid_language"]
        )


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(description="Audio file to transcribe"),
    language_hint: str = Form(DEFAULT_LANGUAGE_HINT, description="Language hint (auto|ar-dz|ar|fr|en)"),
    normalize: bool = Form(False, description="Apply Darija normalization"),
    format: str = Form("json", description="Response format (json|text)"),
):
    """
    Transcribe uploaded audio file.
    
    **Supported formats**: mp3, m4a, ogg, wav, webm, opus
    
    **Max size**: 15MB
    
    **Languages**: Algerian Darija (ar-dz), Arabic (ar), French (fr), English (en)
    
    **Example**:
    ```bash
    curl -X POST http://localhost:8000/api/stt/transcribe \\
      -F "file=@audio.mp3" \\
      -F "language_hint=ar-dz" \\
      -F "normalize=true"
    ```
    """
    trace_id = str(uuid.uuid4())[:8]
    
    logger.info(f"[{trace_id}] Transcribe request: filename={file.filename}, language_hint={language_hint}")
    
    try:
        # Validate
        validate_audio_file(file)
        validate_language_hint(language_hint)
        
        # Read audio bytes
        audio_bytes = await file.read()
        actual_size_mb = len(audio_bytes) / (1024 * 1024)
        
        logger.debug(f"[{trace_id}] Audio size: {actual_size_mb:.2f}MB")
        
        # Check size again (uploaded size might differ from reported)
        if len(audio_bytes) > AUDIO_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ERROR_MESSAGES["file_too_large"]
            )
        
        # Transcribe
        result = await stt_service_client.transcribe_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename,
            language_hint=language_hint,
            normalize=normalize,
            request_id=trace_id,
        )
        
        logger.info(
            f"[{trace_id}] Transcription successful: "
            f"language={result['language']}, "
            f"confidence={result['confidence']:.2f}, "
            f"text_length={len(result['text'])}"
        )
        
        # Format response
        if format == "text":
            # Plain text response
            return JSONResponse({"text": result["text"]})
        else:
            # Full JSON response
            return TranscribeResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id}] Transcription failed: {e}")
        
        # Check if STT unavailable
        if "disabled" in str(e).lower() or "not enabled" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=ERROR_MESSAGES["stt_unavailable"]
            )
        
        # Generic error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERROR_MESSAGES["processing_failed"]
        )


@router.post("/transcribe-url", response_model=TranscribeResponse)
async def transcribe_from_url(request: TranscribeURLRequest):
    """
    Transcribe audio from URL.
    
    **Example**:
    ```bash
    curl -X POST http://localhost:8000/api/stt/transcribe-url \\
      -H "Content-Type: application/json" \\
      -d '{
        "url": "https://example.com/audio.mp3",
        "language_hint": "ar-dz",
        "normalize": false
      }'
    ```
    """
    trace_id = str(uuid.uuid4())[:8]
    
    logger.info(f"[{trace_id}] Transcribe URL request: url={request.url}")
    
    try:
        # Validate
        validate_language_hint(request.language_hint)
        
        # Transcribe
        result = await stt_service_client.transcribe_url(
            url=str(request.url),
            language_hint=request.language_hint,
            normalize=request.normalize,
            request_id=trace_id,
        )
        
        logger.info(
            f"[{trace_id}] URL transcription successful: "
            f"language={result['language']}, "
            f"confidence={result['confidence']:.2f}"
        )
        
        return TranscribeResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id}] URL transcription failed: {e}")
        
        # Check if STT unavailable
        if "disabled" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=ERROR_MESSAGES["stt_unavailable"]
            )
        
        # Download or processing error
        if "download" in str(e).lower() or "404" in str(e) or "403" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to download audio from URL: {str(e)}"
            )
        
        # Generic error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERROR_MESSAGES["processing_failed"]
        )


@router.get("/health", response_model=STTHealthResponse)
async def stt_health():
    """
    Check STT service health.
    
    **Example**:
    ```bash
    curl http://localhost:8000/api/stt/health
    ```
    
    **Response**:
    ```json
    {
      "enabled": true,
      "provider": "local_whisper",
      "model_name": "medium",
      "mode": "real",
      "ready": true,
      "error": null
    }
    ```
    """
    try:
        health_status = await stt_service_client.get_health()
        return STTHealthResponse(**health_status)
    
    except Exception as e:
        logger.exception(f"Health check failed: {e}")
        
        return STTHealthResponse(
            enabled=False,
            provider="unknown",
            model_name=None,
            mode="error",
            ready=False,
            error=str(e)
        )
