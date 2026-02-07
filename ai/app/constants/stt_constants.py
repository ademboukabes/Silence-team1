"""
STT Constants

Audio file constraints, supported formats, language hints, and Darija normalization tokens.
"""

from typing import Dict, Set

# ============================================================================
# Audio File Constraints
# ============================================================================

AUDIO_MAX_MB = 15
AUDIO_MAX_BYTES = AUDIO_MAX_MB * 1024 * 1024  # 15MB in bytes

# ============================================================================
# Supported Audio Formats
# ============================================================================

SUPPORTED_AUDIO_MIME: Set[str] = {
    "audio/mpeg",      # mp3
    "audio/mp4",       # m4a
    "audio/ogg",       # ogg
    "audio/wav",       # wav
    "audio/webm",      # webm
    "audio/x-m4a",     # m4a alternative
    "audio/opus",      # opus
}

SUPPORTED_AUDIO_EXTENSIONS: Set[str] = {
    ".mp3",
    ".m4a",
    ".ogg",
    ".wav",
    ".webm",
    ".opus",
}

# ============================================================================
# Language Configuration
# ============================================================================

STT_LANG_HINTS = ["auto", "ar-dz", "ar", "fr", "en"]
DEFAULT_LANGUAGE_HINT = "auto"

# Language code mapping for Whisper
WHISPER_LANGUAGE_MAP: Dict[str, str] = {
    "auto": None,      # Auto-detect
    "ar-dz": "ar",     # Algerian Darija → treat as Arabic
    "ar": "ar",        # Modern Standard Arabic
    "fr": "fr",        # French
    "en": "en",        # English
}

# ============================================================================
# Darija Normalization (Lightweight)
# ============================================================================

# Common Darija tokens with Arabic equivalents
# This is a small sample for light normalization
DARIJA_NORMALIZATIONS: Dict[str, str] = {
    # Prepositions
    "fel": "في",          # in/at
    "b": "ب",            # with/in
    "men": "من",          # from
    "l": "ل",            # to/for
    
    # Possessives
    "ta3": "تاع",         # of/belonging to
    "ta3i": "تاعي",       # my/mine
    "ta3ek": "تاعك",      # your/yours
    "ta3ha": "تاعها",     # her/hers
    "ta3hom": "تاعهم",    # their/theirs
    
    # Time expressions
    "ghedwa": "غدوة",     # tomorrow
    "el yom": "اليوم",    # today
    "ams": "أمس",         # yesterday
    "daba": "دابا",       # now
    
    # Common verbs
    "rani": "راني",       # I am
    "kayen": "كاين",      # there is
    "rahi": "راهي",       # she is
    "rah": "راه",         # he is
    "hab": "حاب",         # want
    "nbooki": "نبوكي",    # to book
    "nrésérvi": "نريزيرفي", # to reserve
    
    # Questions
    "ch7al": "شحال",      # how much/many
    "wach": "واش",        # is it/question particle
    "kifach": "كيفاش",    # how
    "fin": "فين",         # where
    "waqtash": "وقتاش",   # when
    
    # Common nouns
    "blassa": "بلاصة",    # place/slot
    "terminal": "terminal",  # terminal (keep as is)
    "carrier": "carrier",    # carrier (keep as is)
    "slot": "slot",          # slot (keep as is)
    "booking": "booking",    # booking (keep as is)
    
    # Negation
    "ma": "ما",          # not
    "machi": "ماشي",      # not/isn't
}

# ============================================================================
# STT Provider Configuration Defaults
# ============================================================================

DEFAULT_STT_PROVIDER = "local_whisper"
DEFAULT_STT_MODEL_SIZE = "medium"  # tiny|base|small|medium|large-v3
DEFAULT_STT_DEVICE = "cpu"         # cpu|cuda
DEFAULT_STT_COMPUTE_TYPE = "int8"  # int8|float16|float32
DEFAULT_STT_TIMEOUT = 30.0         # seconds

# ============================================================================
# Error Messages
# ============================================================================

ERROR_MESSAGES = {
    "file_too_large": f"Audio file exceeds maximum size of {AUDIO_MAX_MB}MB",
    "unsupported_format": "Unsupported audio format. Supported: mp3, m4a, ogg, wav, webm, opus",
    "no_file": "No audio file or URL provided",
    "stt_unavailable": "Speech-to-text service is currently unavailable",
    "processing_failed": "Failed to process audio file",
    "invalid_language": f"Invalid language hint. Supported: {', '.join(STT_LANG_HINTS)}",
}
