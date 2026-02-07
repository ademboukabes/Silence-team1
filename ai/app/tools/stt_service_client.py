"""
STT Service Client

Speech-to-Text service with provider abstraction (local_whisper | external_api).
Supports Algerian Darija via Whisper with light normalization.
"""

import os
import logging
import asyncio
import tempfile
import time
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import httpx

from app.constants.stt_constants import (
    WHISPER_LANGUAGE_MAP,
    DARIJA_NORMALIZATIONS,
    DEFAULT_STT_PROVIDER,
    DEFAULT_STT_MODEL_SIZE,
    DEFAULT_STT_DEVICE,
    DEFAULT_STT_COMPUTE_TYPE,
    DEFAULT_STT_TIMEOUT,
)

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

STT_ENABLED = os.getenv("STT_ENABLED", "true").lower() == "true"
STT_PROVIDER = os.getenv("STT_PROVIDER", DEFAULT_STT_PROVIDER)  # local_whisper|external_api
STT_MVP_MODE = os.getenv("STT_MVP_MODE", "false").lower() == "true"
STT_MVP_DUMMY_TEXT = os.getenv("STT_MVP_DUMMY_TEXT", "kayen blassa ghedwa?")

# Local Whisper Settings
STT_MODEL_SIZE = os.getenv("STT_MODEL_SIZE", DEFAULT_STT_MODEL_SIZE)
STT_MODEL_PATH = os.getenv("STT_MODEL_PATH", None)  # None = use default cache
STT_DEVICE = os.getenv("STT_DEVICE", DEFAULT_STT_DEVICE)
STT_COMPUTE_TYPE = os.getenv("STT_COMPUTE_TYPE", DEFAULT_STT_COMPUTE_TYPE)

# External API Settings
STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://localhost:9000")
STT_TRANSCRIBE_PATH = os.getenv("STT_TRANSCRIBE_PATH", "/transcribe")
STT_API_KEY = os.getenv("STT_API_KEY", None)

# Timeouts
STT_TIMEOUT = float(os.getenv("STT_TIMEOUT", str(DEFAULT_STT_TIMEOUT)))

# ============================================================================
# Global State
# ============================================================================

_whisper_model = None
_http_client: Optional[httpx.AsyncClient] = None
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="stt_")

# ============================================================================
# Whisper Model Management (Local Provider)
# ============================================================================


def _load_whisper_model():
    """
    Load Whisper model lazily (first transcription request).
    Runs in background thread to avoid blocking.
    """
    global _whisper_model
    
    if _whisper_model is not None:
        return _whisper_model
    
    try:
        from faster_whisper import WhisperModel
        
        logger.info(f"Loading Whisper model: size={STT_MODEL_SIZE}, device={STT_DEVICE}, compute={STT_COMPUTE_TYPE}")
        
        model = WhisperModel(
            model_size_or_path=STT_MODEL_PATH or STT_MODEL_SIZE,
            device=STT_DEVICE,
            compute_type=STT_COMPUTE_TYPE,
        )
        
        _whisper_model = model
        logger.info("Whisper model loaded successfully")
        return model
        
    except ImportError:
        logger.error("faster-whisper not installed. Install with: pip install faster-whisper")
        raise
    except Exception as e:
        logger.exception(f"Failed to load Whisper model: {e}")
        raise


def _transcribe_with_whisper(audio_path: str, language_hint: str) -> Dict[str, Any]:
    """
    Transcribe audio using local Whisper model.
    Runs in blocking thread pool.
    
    Args:
        audio_path: Path to audio file
        language_hint: Language hint (auto|ar-dz|ar|fr|en)
    
    Returns:
        {
            "text": str,
            "language": str,
            "confidence": float,
            "duration_seconds": float,
            "segments": List[Dict],
        }
    """
    model = _load_whisper_model()
    
    # Map language hint to Whisper language code
    whisper_lang = WHISPER_LANGUAGE_MAP.get(language_hint, None)
    
    # Transcribe
    segments, info = model.transcribe(
        audio_path,
        language=whisper_lang,
        beam_size=5,
        best_of=5,
        temperature=0.0,  # Deterministic
        vad_filter=True,  # Voice activity detection
        vad_parameters=dict(min_silence_duration_ms=500),
    )
    
    # Collect segments
    all_segments = []
    all_text = []
    
    for seg in segments:
        all_segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip(),
            "confidence": seg.avg_logprob if hasattr(seg, 'avg_logprob') else None,
        })
        all_text.append(seg.text.strip())
    
    full_text = " ".join(all_text)
    
    # Detect if Darija based on heuristics
    detected_language = info.language
    if detected_language == "ar" and language_hint == "ar-dz":
        detected_language = "ar-dz"
    elif detected_language == "ar" and _contains_darija_markers(full_text):
        detected_language = "ar-dz"
    
    # Calculate confidence (average of segment confidences)
    confidences = [s.get("confidence", 0) for s in all_segments if s.get("confidence") is not None]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5
    
    # Convert avg_logprob to 0-1 scale (logprob is typically -0.5 to -3.0)
    # Simple heuristic: confidence = exp(avg_logprob)
    import math
    if avg_confidence < 0:
        avg_confidence = math.exp(max(avg_confidence, -3.0))
    
    return {
        "text": full_text,
        "language": detected_language,
        "confidence": min(max(avg_confidence, 0.0), 1.0),
        "duration_seconds": info.duration,
        "segments": all_segments,
    }


def _contains_darija_markers(text: str) -> bool:
    """
    Simple heuristic to detect Darija based on common tokens.
    
    Args:
        text: Transcribed text
    
    Returns:
        True if likely Darija
    """
    text_lower = text.lower()
    darija_markers = ["fel", "ta3", "ghedwa", "kayen", "rani", "hab", "ch7al", "wach", "blassa"]
    
    # If multiple Darija markers found, likely Darija
    marker_count = sum(1 for marker in darija_markers if marker in text_lower)
    return marker_count >= 2


def _normalize_darija(text: str) -> str:
    """
    Apply light normalization for Darija text.
    Maps common Darija tokens to Arabic equivalents.
    
    Args:
        text: Original transcription
    
    Returns:
        Normalized text
    """
    words = text.split()
    normalized_words = []
    
    for word in words:
        word_lower = word.lower()
        if word_lower in DARIJA_NORMALIZATIONS:
            normalized_words.append(DARIJA_NORMALIZATIONS[word_lower])
        else:
            normalized_words.append(word)
    
    return " ".join(normalized_words)


# ============================================================================
# HTTP Client Management (External Provider)
# ============================================================================


def _get_http_client() -> httpx.AsyncClient:
    """Get or create HTTP client singleton."""
    global _http_client
    
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(STT_TIMEOUT),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        )
        logger.info("Created STT HTTP client")
    
    return _http_client


async def _transcribe_external_api(
    audio_bytes: bytes,
    filename: str,
    language_hint: str,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transcribe audio using external STT API.
    
    Args:
        audio_bytes: Audio file bytes
        filename: Original filename
        language_hint: Language hint
        request_id: Request ID for tracing
    
    Returns:
        Normalized transcription result
    """
    client = _get_http_client()
    
    url = f"{STT_SERVICE_URL}{STT_TRANSCRIBE_PATH}"
    
    # Prepare multipart form
    files = {"file": (filename, audio_bytes, "audio/mpeg")}
    data = {"language": language_hint}
    
    headers = {}
    if request_id:
        headers["x-request-id"] = request_id
    if STT_API_KEY:
        headers["Authorization"] = f"Bearer {STT_API_KEY}"
    
    logger.debug(f"Calling external STT API: {url}")
    
    try:
        response = await client.post(url, files=files, data=data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        # Normalize response format
        return {
            "text": result.get("text", ""),
            "language": result.get("language", language_hint),
            "confidence": result.get("confidence", 0.5),
            "duration_seconds": result.get("duration_seconds", 0.0),
            "segments": result.get("segments", []),
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"STT API error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.exception(f"STT API call failed: {e}")
        raise


# ============================================================================
# Public API
# ============================================================================


async def transcribe_bytes(
    audio_bytes: bytes,
    filename: str,
    language_hint: str = "auto",
    normalize: bool = False,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transcribe audio from bytes.
    
    Args:
        audio_bytes: Audio file bytes
        filename: Original filename (for extension detection)
        language_hint: Language hint (auto|ar-dz|ar|fr|en)
        normalize: Apply Darija normalization
        request_id: Request ID for tracing
    
    Returns:
        {
            "text": str,
            "language": str,
            "confidence": float,
            "duration_seconds": float,
            "normalized_text": Optional[str],
            "segments": List[Dict],
            "proofs": Dict,
        }
    
    Raises:
        Exception: If STT unavailable or processing fails
    """
    start_time = time.time()
    
    # Check if STT enabled
    if not STT_ENABLED:
        raise Exception("STT is disabled (STT_ENABLED=false)")
    
    # MVP dummy mode (development only)
    if STT_MVP_MODE:
        logger.warning("Using STT MVP dummy mode - returning dummy transcription")
        return {
            "text": STT_MVP_DUMMY_TEXT,
            "language": "ar-dz",
            "confidence": 1.0,
            "duration_seconds": 2.0,
            "normalized_text": _normalize_darija(STT_MVP_DUMMY_TEXT) if normalize else None,
            "segments": [],
            "proofs": {
                "trace_id": request_id,
                "provider": "mvp_dummy",
                "model": "none",
                "mode": "mvp",
                "note": "dummy transcription for development",
                "processing_time_ms": 0,
            }
        }
    
    # Route to appropriate provider
    if STT_PROVIDER == "local_whisper":
        # Save to temp file (Whisper requires file path)
        suffix = Path(filename).suffix or ".mp3"
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(audio_bytes)
        
        try:
            # Run in thread pool (blocking operation)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                _executor,
                _transcribe_with_whisper,
                tmp_path,
                language_hint
            )
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        provider_name = "faster-whisper"
        model_name = STT_MODEL_SIZE
        
    elif STT_PROVIDER == "external_api":
        result = await _transcribe_external_api(
            audio_bytes,
            filename,
            language_hint,
            request_id
        )
        provider_name = "external_api"
        model_name = STT_SERVICE_URL
        
    else:
        raise ValueError(f"Unknown STT provider: {STT_PROVIDER}")
    
    # Apply normalization if requested
    normalized_text = None
    if normalize and result["language"] in ["ar-dz", "ar"]:
        normalized_text = _normalize_darija(result["text"])
    
    processing_time_ms = int((time.time() - start_time) * 1000)
    
    return {
        "text": result["text"],
        "language": result["language"],
        "confidence": result["confidence"],
        "duration_seconds": result["duration_seconds"],
        "normalized_text": normalized_text,
        "segments": result.get("segments", []),
        "proofs": {
            "trace_id": request_id,
            "provider": provider_name,
            "model": model_name,
            "mode": "real",
            "processing_time_ms": processing_time_ms,
        }
    }


async def transcribe_url(
    url: str,
    language_hint: str = "auto",
    normalize: bool = False,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transcribe audio from URL.
    
    Args:
        url: URL to audio file
        language_hint: Language hint
        normalize: Apply Darija normalization
        request_id: Request ID for tracing
    
    Returns:
        Same as transcribe_bytes()
    """
    logger.debug(f"Downloading audio from URL: {url}")
    
    # Download audio
    client = _get_http_client()
    
    try:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        audio_bytes = response.content
        
        # Extract filename from URL
        filename = Path(url).name or "audio.mp3"
        
        # Transcribe
        return await transcribe_bytes(
            audio_bytes,
            filename,
            language_hint,
            normalize,
            request_id
        )
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to download audio from URL: {e.response.status_code}")
        raise Exception(f"Failed to download audio: {e.response.status_code}")
    except Exception as e:
        logger.exception(f"URL transcription failed: {e}")
        raise


async def get_health() -> Dict[str, Any]:
    """
    Get STT service health status.
    
    Returns:
        {
            "enabled": bool,
            "provider": str,
            "model_name": Optional[str],
            "mode": str,
            "ready": bool,
            "error": Optional[str],
        }
    """
    if not STT_ENABLED:
        return {
            "enabled": False,
            "provider": "none",
            "model_name": None,
            "mode": "disabled",
            "ready": False,
            "error": "STT is disabled",
        }
    
    if STT_MVP_MODE:
        return {
            "enabled": True,
            "provider": "mvp_dummy",
            "model_name": "none",
            "mode": "mvp",
            "ready": True,
            "error": None,
        }
    
    # Check provider health
    try:
        if STT_PROVIDER == "local_whisper":
            # Try loading model (lazy load)
            global _whisper_model
            if _whisper_model is None:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(_executor, _load_whisper_model)
            
            return {
                "enabled": True,
                "provider": "local_whisper",
                "model_name": STT_MODEL_SIZE,
                "mode": "real",
                "ready": True,
                "error": None,
            }
            
        elif STT_PROVIDER == "external_api":
            # Ping external API (optional health check endpoint)
            return {
                "enabled": True,
                "provider": "external_api",
                "model_name": STT_SERVICE_URL,
                "mode": "real",
                "ready": True,  # Assume ready (can add actual health check)
                "error": None,
            }
        
        else:
            return {
                "enabled": False,
                "provider": STT_PROVIDER,
                "model_name": None,
                "mode": "error",
                "ready": False,
                "error": f"Unknown provider: {STT_PROVIDER}",
            }
            
    except Exception as e:
        logger.exception(f"STT health check failed: {e}")
        return {
            "enabled": True,
            "provider": STT_PROVIDER,
            "model_name": None,
            "mode": "error",
            "ready": False,
            "error": str(e),
        }


async def aclose_client():
    """Close HTTP client and cleanup resources."""
    global _http_client, _executor
    
    if _http_client:
        await _http_client.aclose()
        _http_client = None
        logger.info("Closed STT HTTP client")
    
    # Note: ThreadPoolExecutor cleanup handled by Python on exit
