"""
Voice Chat API Router

Voice-to-chat endpoint that integrates STT with existing orchestrator.
Accepts audio input, transcribes via STT, then routes to orchestrator like text chat.
"""

import logging
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from app.schemas.stt import VoiceChatResponse
from app.constants.stt_constants import ERROR_MESSAGES
from app.tools import stt_service_client

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# Voice Chat Endpoint
# ============================================================================


@router.post("/voice", response_model=VoiceChatResponse)
async def voice_chat(
    file: Optional[UploadFile] = File(None, description="Audio file"),
    url: Optional[str] = Form(None, description="Audio URL (alternative to file)"),
    language_hint: str = Form("auto", description="Language hint"),
    user_role: str = Form("CARRIER", description="User role"),
    user_id: Optional[str] = Form(None, description="User ID"),
):
    """
    Voice chat endpoint - STT + Orchestrator.
    
    Accepts audio input (file or URL), transcribes to text, then processes
    through the same orchestrator pipeline as text chat.
    
    **Input**: Either `file` (multipart upload) OR `url` (form field), not both.
    
    **Example with file**:
    ```bash
    curl -X POST http://localhost:8000/api/chat/voice \\
      -F "file=@booking_request.mp3" \\
      -F "user_role=CARRIER" \\
      -F "language_hint=ar-dz"
    ```
    
    **Example with URL**:
    ```bash
    curl -X POST http://localhost:8000/api/chat/voice \\
      -F "url=https://example.com/audio.mp3" \\
      -F "user_role=CARRIER"
    ```
    
    **Response** includes:
    - Orchestrator response (message, data, proofs)
    - STT metadata (transcription, language, confidence)
    - input_modality: "voice"
    """
    trace_id = str(uuid.uuid4())[:8]
    
    logger.info(f"[{trace_id}] Voice chat request: user_role={user_role}, has_file={file is not None}, has_url={url is not None}")
    
    try:
        # Validate: exactly one of file or url
        if (file and url) or (not file and not url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide either 'file' or 'url', not both or neither"
            )
        
        # Step 1: Transcribe audio
        if file:
            logger.debug(f"[{trace_id}] Transcribing uploaded file: {file.filename}")
            
            audio_bytes = await file.read()
            
            stt_result = await stt_service_client.transcribe_bytes(
                audio_bytes=audio_bytes,
                filename=file.filename,
                language_hint=language_hint,
                normalize=False,  # Keep original transcription
                request_id=trace_id,
            )
        else:
            logger.debug(f"[{trace_id}] Transcribing from URL: {url}")
            
            stt_result = await stt_service_client.transcribe_url(
                url=url,
                language_hint=language_hint,
                normalize=False,
                request_id=trace_id,
            )
        
        transcription = stt_result["text"]
        
        logger.info(
            f"[{trace_id}] Transcription complete: "
            f"text='{transcription[:50]}...', "
            f"language={stt_result['language']}, "
            f"confidence={stt_result['confidence']:.2f}"
        )
        
        # Step 2: Process through orchestrator (same as text chat)
        from app.orchestrator.orchestrator import Orchestrator
        
        orchestrator = Orchestrator()
        
        # Build context (similar to text chat)
        context = {
            "message": transcription,
            "entities": {},  # Will be extracted by orchestrator
            "history": [],  # No history for single voice message
            "user_role": user_role,
            "user_id": user_id,
            "trace_id": trace_id,
            "auth_header": None,  # No auth for public voice endpoint
            "input_modality": "voice",  # Mark as voice input
        }
        
        logger.debug(f"[{trace_id}] Calling orchestrator with transcription")
        
        orchestrator_response = await orchestrator.execute(context)
        
        logger.info(f"[{trace_id}] Orchestrator response ready")
        
        # Step 3: Combine orchestrator response + STT metadata
        response = {
            "message": orchestrator_response.get("message", ""),
            "data": orchestrator_response.get("data", {}),
            "proofs": orchestrator_response.get("proofs", {}),
            "stt": {
                "text": stt_result["text"],
                "language": stt_result["language"],
                "confidence": stt_result["confidence"],
                "duration_seconds": stt_result["duration_seconds"],
            },
            "input_modality": "voice",
        }
        
        # Add trace_id to proofs if not already there
        if "trace_id" not in response["proofs"]:
            response["proofs"]["trace_id"] = trace_id
        
        return VoiceChatResponse(**response)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{trace_id}] Voice chat failed: {e}")
        
        # Check if STT unavailable
        if "disabled" in str(e).lower() or "not enabled" in str(e).lower():
            # Return structured error response
            return VoiceChatResponse(
                message="Speech-to-text is not enabled yet. Please use text chat or enable STT.",
                data={
                    "error_type": "STTUnavailable",
                    "suggestion": "Use POST /api/ai/chat with text message instead",
                },
                proofs={
                    "trace_id": trace_id,
                    "mode": "error",
                },
                stt={
                    "error": "STT service unavailable",
                },
                input_modality="voice",
            )
        
        # Generic error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice chat processing failed"
        )
