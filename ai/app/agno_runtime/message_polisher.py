"""
Message Polisher - Improve agent responses using LLM
"""

import logging
from typing import Dict, Any

from .llm_provider import llm_complete
from .prompts import build_polish_prompt

logger = logging.getLogger(__name__)


async def polish_message(
    original_message: str,
    agent_response: Dict[str, Any],
    trace_id: str = "unknown"
) -> str:
    """
    Polish agent response message using LLM.
    
    Args:
        original_message: User's original message
        agent_response: Agent's response dict with 'message', 'data', 'proofs'
        trace_id: Request trace ID
    
    Returns:
        Polished message string
    """
    try:
        agent_message = agent_response.get("message", "")
        
        # If message is already good or empty, skip polishing
        if not agent_message or len(agent_message) < 10:
            return agent_message
        
        # Build context from response
        context = {
            "intent": agent_response.get("intent"),
            "has_data": bool(agent_response.get("data"))
        }
        
        # Build prompt
        prompt = build_polish_prompt(original_message, agent_message, context)
        
        # Call LLM
        polished = await llm_complete(
            prompt,
            temperature=0.3,  # Slightly higher for creative polishing
            max_tokens=512,
            trace_id=trace_id
        )
        
        # Clean up response
        polished = polished.strip()
        
        # If polishing failed or returned empty, use original
        if not polished or len(polished) < 5:
            logger.warning(f"[{trace_id[:8]}] Polishing returned empty - using original")
            return agent_message
        
        logger.info(f"[{trace_id[:8]}] Message polished successfully")
        return polished
        
    except Exception as e:
        logger.warning(f"[{trace_id[:8]}] Message polishing error: {e} - using original")
        return agent_response.get("message", "")
