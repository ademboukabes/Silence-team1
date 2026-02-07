"""
AGNO Runtime - LLM-Powered Intent Classification with Groq

Uses Groq for ultra-fast LLM inference (much faster than OpenAI).
Supports both Groq and OpenAI providers.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Configuration
AGNO_ENABLED = os.getenv("AGNO_ENABLED", "false").lower() == "true"
AGNO_PROVIDER = os.getenv("AGNO_PROVIDER", "groq").lower()  # groq or openai
AGNO_MODEL = os.getenv("AGNO_MODEL", "llama-3.1-8b-instant")  # Groq default
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AGNO_TIMEOUT = float(os.getenv("AGNO_TIMEOUT", "6.0"))

# Intent confidence threshold
MIN_CONFIDENCE = 0.45


def is_agno_enabled() -> bool:
    """
    Check if AGNO is enabled and properly configured.
    
    Returns:
        True if AGNO is enabled and has API key, False otherwise
        
    Note: Returns False for graceful degradation instead of raising exceptions.
          This allows the system to fall back to pattern-based classification.
    """
    if not AGNO_ENABLED:
        logger.debug("AGNO disabled via AGNO_ENABLED=false")
        return False
    
    # Check for API key based on provider
    if AGNO_PROVIDER == "groq" and not GROQ_API_KEY:
        logger.warning("AGNO enabled with Groq but GROQ_API_KEY not set - using pattern fallback")
        return False
    elif AGNO_PROVIDER == "openai" and not OPENAI_API_KEY:
        logger.warning("AGNO enabled with OpenAI but OPENAI_API_KEY not set - using pattern fallback")
        return False
    
    return True


async def classify_intent(
    message: str,
    history: List[Dict[str, Any]],
    trace_id: str
) -> Dict[str, Any]:
    """
    Classify user intent using LLM (Groq or OpenAI) with strict timeout.
    
    Args:
        message: User's message
        history: Conversation history
        trace_id: Request trace ID
    
    Returns:
        {
            "intent": str,  # detected intent
            "entities": dict,  # extracted entities
            "confidence": float  # 0.0 to 1.0
        }
    
    Raises:
        HTTPException: If AGNO is not configured
        asyncio.TimeoutError: If LLM call exceeds AGNO_TIMEOUT
    """
    logger.debug(f"[{trace_id[:8]}] AGNO classify_intent called (provider={AGNO_PROVIDER})")
    
    # Check if AGNO is enabled
    if not is_agno_enabled():
        # Use fast pattern-based fallback
        logger.info(f"[{trace_id[:8]}] AGNO disabled - using pattern-based classification")
        return await _classify_with_patterns(message, trace_id)
    
    try:
        # Wrap LLM call with timeout
        if AGNO_PROVIDER == "groq":
            result = await asyncio.wait_for(
                _classify_with_groq(message, history, trace_id),
                timeout=AGNO_TIMEOUT
            )
        else:  # openai
            result = await asyncio.wait_for(
                _classify_with_openai(message, history, trace_id),
                timeout=AGNO_TIMEOUT
            )
        return result
    except asyncio.TimeoutError:
        logger.error(f"[{trace_id[:8]}] AGNO timeout after {AGNO_TIMEOUT}s")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "error": "agno_timeout",
                "message": f"AGNO classification timed out after {AGNO_TIMEOUT}s",
                "trace_id": trace_id
            }
        )
    except Exception as e:
        logger.error(f"[{trace_id[:8]}] AGNO error: {e}")
        # Fallback to pattern-based on LLM errors
        logger.warning(f"[{trace_id[:8]}] Falling back to pattern-based classification")
        return await _classify_with_patterns(message, trace_id)


async def _classify_with_groq(
    message: str,
    history: List[Dict[str, Any]],
    trace_id: str
) -> Dict[str, Any]:
    """
    Classify intent using Groq API (ultra-fast inference).
    """
    try:
        from groq import AsyncGroq
        
        client = AsyncGroq(api_key=GROQ_API_KEY)
        
        # Build prompt
        prompt = f"""You are an intent classifier for a logistics platform. Classify the user's intent from this message.

User message: "{message}"

Available intents:
- help: User needs help or greeting
- booking_status: Check status of existing booking
- booking_create: Create new booking/reservation
- slot_availability: Check available time slots
- passage_history: View passage/entry history
- blockchain_audit: Verify blockchain proofs
- carrier_scoring: Get carrier performance scores

Respond with ONLY a JSON object (no markdown, no explanation):
{{"intent": "intent_name", "entities": {{}}, "confidence": 0.95}}"""

        response = await client.chat.completions.create(
            model=AGNO_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=100
        )
        
        # Parse response
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        import json
        result = json.loads(content)
        
        logger.info(f"[{trace_id[:8]}] Groq classified: {result['intent']} (confidence={result['confidence']})")
        return result
        
    except ImportError:
        logger.warning(f"[{trace_id[:8]}] Groq library not installed - using patterns")
        return await _classify_with_patterns(message, trace_id)
    except Exception as e:
        logger.error(f"[{trace_id[:8]}] Groq API error: {e}")
        return await _classify_with_patterns(message, trace_id)


async def _classify_with_openai(
    message: str,
    history: List[Dict[str, Any]],
    trace_id: str
) -> Dict[str, Any]:
    """
    Classify intent using OpenAI API.
    """
    # TODO: Implement OpenAI integration
    logger.warning(f"[{trace_id[:8]}] OpenAI provider not yet implemented - using patterns")
    return await _classify_with_patterns(message, trace_id)


async def _classify_with_patterns(message: str, trace_id: str) -> Dict[str, Any]:
    """
    Fast pattern-based classification (fallback or when AGNO disabled).
    """
    message_lower = message.lower()
    
    # Simple pattern matching
    if any(word in message_lower for word in ["help", "assist", "guide", "hi", "hello", "bonjour"]):
        return {"intent": "help", "entities": {}, "confidence": 0.95}
    elif "ref" in message_lower or ("status" in message_lower and "booking" in message_lower):
        return {"intent": "booking_status", "entities": {}, "confidence": 0.90}
    elif any(word in message_lower for word in ["book", "reserve", "create", "réserver"]):
        return {"intent": "booking_create", "entities": {}, "confidence": 0.85}
    elif any(word in message_lower for word in ["available", "slot", "free", "disponible"]):
        return {"intent": "slot_availability", "entities": {}, "confidence": 0.85}
    elif "passage" in message_lower or "history" in message_lower or "historique" in message_lower:
        return {"intent": "passage_history", "entities": {}, "confidence": 0.85}
    elif "blockchain" in message_lower or "proof" in message_lower or "verify" in message_lower:
        return {"intent": "blockchain_audit", "entities": {}, "confidence": 0.85}
    elif "carrier" in message_lower and ("score" in message_lower or "performance" in message_lower):
        return {"intent": "carrier_scoring", "entities": {}, "confidence": 0.85}
    else:
        return {"intent": "help", "entities": {}, "confidence": 0.60}


def get_agno_config() -> Dict[str, Any]:
    """
    Get current AGNO configuration.
    
    Returns:
        Configuration dictionary
    """
    return {
        "enabled": AGNO_ENABLED,
        "provider": AGNO_PROVIDER,
        "model": AGNO_MODEL,
        "has_groq_key": bool(GROQ_API_KEY),
        "has_openai_key": bool(OPENAI_API_KEY),
        "min_confidence": MIN_CONFIDENCE,
        "timeout": AGNO_TIMEOUT,
    }


def validate_agno_config_at_startup() -> None:
    """
    Validate AGNO configuration at application startup.
    """
    if AGNO_ENABLED:
        if AGNO_PROVIDER == "groq" and GROQ_API_KEY:
            logger.info(f"✅ AGNO enabled with Groq (model={AGNO_MODEL}, timeout={AGNO_TIMEOUT}s)")
        elif AGNO_PROVIDER == "openai" and OPENAI_API_KEY:
            logger.info(f"✅ AGNO enabled with OpenAI (model={AGNO_MODEL}, timeout={AGNO_TIMEOUT}s)")
        else:
            logger.error("=" * 70)
            logger.error("AGNO CONFIGURATION ERROR")
            logger.error(f"AGNO_ENABLED=true with provider={AGNO_PROVIDER} but API key not set!")
            logger.error("Chat requests will use pattern-based fallback.")
            logger.error("=" * 70)
    else:
        logger.info("ℹ️ AGNO disabled - using fast pattern-based classification")


# Module initialization
logger.info(f"AGNO Runtime initialized - Enabled: {AGNO_ENABLED}, Provider: {AGNO_PROVIDER}")
validate_agno_config_at_startup()
