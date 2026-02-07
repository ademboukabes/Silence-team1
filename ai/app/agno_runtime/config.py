"""
AGNO Configuration

Environment variables for LLM-based orchestration with Google Gemini.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class AGNOSettings(BaseSettings):
    """AGNO and Gemini configuration"""
    
    # AGNO Toggle
    agno_enabled: bool = Field(default=True, alias="AGNO_ENABLED")
    
    # Google AI Studio (same key as before, just renamed env var)
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_AI_STUDIO_API_KEY")
    
    # Fallback to old env var name for backward compatibility
    @property
    def api_key(self) -> Optional[str]:
        return self.google_api_key or os.getenv("GOOGLE_API_KEY")
    
    # LLM Configuration
    llm_model_name: str = Field(default="gemini-1.5-pro", alias="LLM_MODEL_NAME")
    llm_temperature: float = Field(default=0.2, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=1024, alias="LLM_MAX_TOKENS")
    llm_timeout_seconds: int = Field(default=20, alias="LLM_TIMEOUT_SECONDS")
    
    # Intent Classification
    intent_confidence_threshold: float = Field(default=0.45, alias="INTENT_CONFIDENCE_THRESHOLD")
    
    # Debug
    llm_debug: bool = Field(default=False, alias="LLM_DEBUG")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


# Singleton instance
_settings: Optional[AGNOSettings] = None


def get_settings() -> AGNOSettings:
    """Get AGNO settings singleton"""
    global _settings
    if _settings is None:
        _settings = AGNOSettings()
    return _settings


def is_agno_enabled() -> bool:
    """Check if AGNO is enabled and configured"""
    settings = get_settings()
    
    if not settings.agno_enabled:
        return False
    
    if not settings.api_key:
        return False
    
    return True
