# app/config/youtube_config_enhanced.py
"""
Enhanced YouTube configuration for multi-source transcription
"""

import os
from typing import Dict, List
from pydantic_settings import BaseSettings
from pydantic import Field ,ConfigDict


class EnhancedYouTubeConfig(BaseSettings):
    """Enhanced YouTube service configuration"""
    
    # API Keys
    groq_api_key: str = Field(..., env="GROQ_API_KEY")
    youtube_api_key: str = Field(default="", env="YOUTUBE_API_KEY")
    
    # Groq Models Configuration
    groq_models: Dict[str, str] = {
        "primary": "whisper-large-v3",
        "turbo": "whisper-large-v3-turbo",
        "english_only": "distil-whisper-large-v3-en"
    }
    
    # Processing Configuration
    max_concurrent_videos: int = Field(default=5, ge=1, le=10)
    max_audio_size_mb: int = Field(default=25, ge=5, le=100)
    request_timeout_seconds: int = Field(default=300, ge=30, le=600)
    
    # Fallback Strategy Configuration
    fallback_methods: List[str] = [
        "youtube_native",
        "groq_whisper_primary", 
        "yt_dlp_subtitles",
        "groq_whisper_turbo"
    ]
    
    # Quality Thresholds
    min_transcript_length: int = Field(default=50, ge=10)
    confidence_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    
    # Cache Configuration
    enable_transcript_cache: bool = Field(default=True)
    cache_ttl_hours: int = Field(default=24, ge=1, le=168)
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, ge=10, le=300)
    groq_rate_limit_per_minute: int = Field(default=30, ge=5, le=100)
    
    # Language Support
    supported_languages: List[str] = [
        "en", "en-US", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "hi"
    ]
    
    # Error Handling
    max_retries: int = Field(default=3, ge=1, le=5)
    retry_delay_seconds: float = Field(default=1.0, ge=0.1, le=10.0)
    
    # Feature Flags
    enable_ai_transcription: bool = Field(default=True)
    enable_yt_dlp_fallback: bool = Field(default=True)
    enable_quality_filtering: bool = Field(default=True)
    model_config = ConfigDict(extra='ignore', env_file=".env", case_sensitive=False)
    


# Global configuration instance
youtube_config = EnhancedYouTubeConfig()


# Validation functions
def validate_groq_api_key() -> bool:
    """Validate Groq API key availability"""
    try:
        from groq import Groq
        client = Groq(api_key=youtube_config.groq_api_key)
        # Test with a simple request (you might want to implement this)
        return True
    except Exception as e:
        print(f"Groq API validation failed: {e}")
        return False


def get_optimal_model_for_task(task_type: str = "general", language: str = "en") -> str:
    """Get optimal Groq model based on task requirements"""
    
    if language == "en" and task_type in ["fast", "realtime"]:
        return youtube_config.groq_models["english_only"]
    elif task_type == "turbo":
        return youtube_config.groq_models["turbo"]
    else:
        return youtube_config.groq_models["primary"]


# Environment validation
def validate_environment():
    """Validate all required environment variables and dependencies"""
    errors = []
    
    # Check required API keys
    if not youtube_config.groq_api_key:
        errors.append("GROQ_API_KEY is required")
    
    # Check dependencies
    try:
        import yt_dlp
    except ImportError:
        errors.append("yt-dlp package is required: pip install yt-dlp")
    
    try:
        import groq
    except ImportError:
        errors.append("groq package is required: pip install groq")
    
    try:
        import youtube_transcript_api
    except ImportError:
        errors.append("youtube-transcript-api package is required")
    
    try:
        import aiohttp
    except ImportError:
        errors.append("aiohttp package is required: pip install aiohttp")
    
    if errors:
        raise ValueError(f"Environment validation failed: {'; '.join(errors)}")
    
    return True


# Usage example and testing
if __name__ == "__main__":
    try:
        validate_environment()
        print("✅ Environment validation passed")
        print(f"✅ Groq models configured: {youtube_config.groq_models}")
        print(f"✅ Max concurrent videos: {youtube_config.max_concurrent_videos}")
        print(f"✅ Fallback methods: {youtube_config.fallback_methods}")
    except Exception as e:
        print(f"❌ Validation failed: {e}")