"""
LLM Provider - Google Gemini Client

Centralized Gemini API client for AGNO runtime.
"""

import logging
import asyncio
from typing import Optional
import google.generativeai as genai

from .config import get_settings

logger = logging.getLogger(__name__)

# Initialize Gemini client
_client_initialized = False


def _initialize_client():
    """Initialize Gemini client with API key"""
    global _client_initialized
    
    if _client_initialized:
        return
    
    settings = get_settings()
    api_key = settings.api_key
    
    if not api_key:
        logger.warning("GOOGLE_AI_STUDIO_API_KEY not set - LLM features disabled")
        return
    
    try:
        genai.configure(api_key=api_key)
        _client_initialized = True
        logger.info(f"Gemini client initialized with model: {settings.llm_model_name}")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")


async def llm_complete(
    prompt: str,
    *,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    trace_id: str = "unknown"
) -> str:
    """
    Complete a prompt using Google Gemini.
    
    Args:
        prompt: The prompt to complete
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        trace_id: Request trace ID for logging
    
    Returns:
        Generated text response
    
    Raises:
        Exception: If API call fails after retry
    """
    _initialize_client()
    
    settings = get_settings()
    
    # Use provided values or defaults
    temp = temperature if temperature is not None else settings.llm_temperature
    max_tok = max_tokens if max_tokens is not None else settings.llm_max_tokens
    
    logger.info(f"[{trace_id[:8]}] LLM call - model={settings.llm_model_name} temp={temp}")
    
    try:
        # Create model
        model = genai.GenerativeModel(
            model_name=settings.llm_model_name,
            generation_config={
                "temperature": temp,
                "max_output_tokens": max_tok,
            }
        )
        
        # Generate with timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=settings.llm_timeout_seconds
        )
        
        result = response.text
        
        if settings.llm_debug:
            logger.debug(f"[{trace_id[:8]}] LLM response: {result[:200]}...")
        
        return result
        
    except asyncio.TimeoutError:
        logger.error(f"[{trace_id[:8]}] LLM timeout after {settings.llm_timeout_seconds}s")
        raise Exception("LLM request timed out")
        
    except Exception as e:
        logger.error(f"[{trace_id[:8]}] LLM error: {e}")
        
        # Retry once
        try:
            logger.info(f"[{trace_id[:8]}] Retrying LLM call...")
            await asyncio.sleep(1)
            
            model = genai.GenerativeModel(
                model_name=settings.llm_model_name,
                generation_config={
                    "temperature": temp,
                    "max_output_tokens": max_tok,
                }
            )
            
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=settings.llm_timeout_seconds
            )
            
            return response.text
            
        except Exception as retry_error:
            logger.error(f"[{trace_id[:8]}] LLM retry failed: {retry_error}")
            raise Exception(f"LLM request failed: {str(e)}")
