"""
Intent Classifier - LLM-based intent detection using AGNO
"""

import logging
import json
from typing import Dict, Any, List

from .llm_provider import llm_complete
from .prompts import build_intent_prompt
from .config import get_settings

logger = logging.getLogger(__name__)


async def classify_intent(
    message: str,
    history: List[Dict[str, Any]],
    trace_id: str = "unknown"
) -> Dict[str, Any]:
    """
    Classify user intent using LLM.
    
    Args:
        message: User's message
        history: Conversation history
        trace_id: Request trace ID
    
    Returns:
        {
            "intent": str,
            "entities": dict,
            "confidence": float
        }
    """
    settings = get_settings()
    
    try:
        # Build prompt
        prompt = build_intent_prompt(message, history)
        
        # Call LLM
        response = await llm_complete(
            prompt,
            temperature=0.1,  # Low temperature for consistent classification
            max_tokens=512,
            trace_id=trace_id
        )
        
        # Parse JSON response
        result = _parse_intent_response(response, trace_id)
        
        # Validate confidence threshold
        confidence = result.get("confidence", 0.0)
        if confidence < settings.intent_confidence_threshold:
            logger.info(f"[{trace_id[:8]}] Low confidence ({confidence:.2f}) - returning unknown")
            return {
                "intent": "unknown",
                "entities": {},
                "confidence": confidence
            }
        
        logger.info(f"[{trace_id[:8]}] Intent: {result['intent']} (confidence: {confidence:.2f})")
        return result
        
    except Exception as e:
        logger.error(f"[{trace_id[:8]}] Intent classification error: {e}")
        # Return unknown intent on error
        return {
            "intent": "unknown",
            "entities": {},
            "confidence": 0.0
        }


def _parse_intent_response(response: str, trace_id: str) -> Dict[str, Any]:
    """
    Parse LLM response into intent result.
    
    Handles various response formats and provides fallback.
    """
    try:
        # Try to extract JSON from response
        response = response.strip()
        
        # Remove markdown code blocks if present
        if response.startswith("```"):
            lines = response.split("\n")
            # Remove first and last lines (```json and ```)
            response = "\n".join(lines[1:-1])
        
        # Parse JSON
        result = json.loads(response)
        
        # Validate required fields
        if "intent" not in result:
            raise ValueError("Missing 'intent' field")
        
        # Ensure entities and confidence exist
        if "entities" not in result:
            result["entities"] = {}
        
        if "confidence" not in result:
            result["confidence"] = 0.5
        
        # Validate intent is a known value
        valid_intents = {
            "booking_status",
            "booking_create",
            "slot_availability",
            "passage_history",
            "blockchain_audit",
            "help",
            "unknown"
        }
        
        if result["intent"] not in valid_intents:
            logger.warning(f"[{trace_id[:8]}] Unknown intent: {result['intent']} - defaulting to 'unknown'")
            result["intent"] = "unknown"
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"[{trace_id[:8]}] JSON parse error: {e}")
        logger.debug(f"[{trace_id[:8]}] Raw response: {response[:200]}")
        
        # Fallback: try to extract intent from text
        return _fallback_intent_extraction(response, trace_id)
    
    except Exception as e:
        logger.error(f"[{trace_id[:8]}] Intent parsing error: {e}")
        return {
            "intent": "unknown",
            "entities": {},
            "confidence": 0.0
        }


def _fallback_intent_extraction(response: str, trace_id: str) -> Dict[str, Any]:
    """
    Fallback intent extraction from non-JSON response.
    
    Looks for intent keywords in the response text.
    """
    response_lower = response.lower()
    
    # Simple keyword matching
    if "booking_status" in response_lower or "status" in response_lower:
        intent = "booking_status"
    elif "booking_create" in response_lower or "create" in response_lower or "book" in response_lower:
        intent = "booking_create"
    elif "slot_availability" in response_lower or "availability" in response_lower:
        intent = "slot_availability"
    elif "passage_history" in response_lower or "passage" in response_lower:
        intent = "passage_history"
    elif "blockchain" in response_lower or "audit" in response_lower:
        intent = "blockchain_audit"
    elif "help" in response_lower or "greeting" in response_lower:
        intent = "help"
    else:
        intent = "unknown"
    
    logger.info(f"[{trace_id[:8]}] Fallback extraction: {intent}")
    
    return {
        "intent": intent,
        "entities": {},
        "confidence": 0.3  # Low confidence for fallback
    }
