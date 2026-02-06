"""
Intent Detector - Multilingual Intent Classification

Deterministic intent detection with multilingual support (FR/EN).
High precision pattern matching for routing to specialized agents.

Supported intents:
- booking_status
- slot_availability
- slot_recommendation

- passage_history

- blockchain_audit
- help
- smalltalk
- unknown
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class IntentResult:
    """Intent detection result with confidence and reasoning."""
    intent: str
    confidence: float
    reasoning: List[str]  # Matched rules/patterns
    entities_hint: Dict[str, Any]  # Suggested entities for this intent


# ============================================================================
# Intent Patterns (Priority Ordered - Higher Priority First)
# ============================================================================

INTENT_PATTERNS = {
    # HIGHEST PRIORITY: Help/Greetings
    "help": [
        (r"\b(help|assist|what can|how to|guide|aide|comment)\b", "help_keyword", 0.95),
        (r"^(hi|hello|hey|bonjour|salam|salut)([\s\!]|$)", "greeting", 0.95),
        (r"\b(what (can|do) you|qu[''']est-ce que tu|que peux-tu)\b", "capability_query", 0.90),
    ],
    
    # VERY HIGH PRIORITY: Blockchain audit
    "blockchain_audit": [
        (r"\b(blockchain|proof|verify|audit|trace|prouv|vérif)\b.*\b(booking|reservation|ref|transaction)\b", "blockchain_booking", 0.90),
        (r"\b(prove|verify|audit|trace|prouv|vérif)\b", "audit_keyword", 0.85),
    ],
    
    # HIGH PRIORITY: Operator analytics
    "operator_analytics_overview": [
        (r"\b(operator|opérateur).*\b(analytics|performance|analyse|aperçu|overview)\b", "operator_analytics_explicit", 0.92),
        (r"\b(ai overview|aperçu ia|business analyst|ba report)\b", "ai_overview", 0.90),
        (r"\b(management score|planning quality|operator behavior)\b", "operator_metrics", 0.88),
        (r"\b(forecast|prévision|predict).*\b(month|mois|throughput|capacity)\b", "forecast_request", 0.85),
    ],

    

    

    
    # MEDIUM PRIORITY: Passage history
    "passage_history": [
        (r"\b(passage|entry|entries|truck|vehicle|camion|véhicule).*\b(history|yesterday|past|previous|historique|hier|passé|précédent)\b", "passage_history_explicit", 0.90),
        (r"\b(show|list|get|afficher|lister).*\b(passage|entry|truck|camion)\b", "show_passage", 0.85),
        (r"\byesterday.*\b(passage|truck|entry|camion)\b", "yesterday_passage", 0.88),
        (r"\b(hier|yesterday).*\b(passage|entrée|camion)\b", "french_yesterday_passage", 0.88),
    ],
    
    # MEDIUM PRIORITY: Slot recommendation (more specific than availability)
    "slot_recommendation": [
        (r"\b(recommend|suggest|best|optimal|conseiller|suggérer|meilleur)\b.*\b(slot|time|créneau|heure)\b", "recommend_slot_explicit", 0.92),
        (r"\b(which|what|quel).*\b(slot|time|créneau).*\b(best|better|recommend|meilleur|conseillé)\b", "which_best_slot", 0.90),
        (r"\b(alternative|other|autre).*\b(slot|time|créneau)\b", "alternative_slot", 0.85),
    ],
    
    # LOWER PRIORITY: Slot availability (broader)
    "slot_availability": [
        (r"\b(available|availability|free|open|disponible|disponibilité|libre|ouvert).*\b(slot|time|appointment|créneau|heure|rendez-vous)\b", "slot_availability_explicit", 0.90),
        (r"\b(slot|time|appointment|créneau|heure).*\b(available|free|open|disponible|libre)\b", "slot_available_reversed", 0.90),
        (r"\b(book|reserve|schedule|réserver|planifier).*\b(slot|time|créneau|heure)\b", "book_slot", 0.85),
        (r"\b(check|voir|vérifier).*\b(availability|disponibilité)\b", "check_availability", 0.82),
    ],
    
    # LOWER PRIORITY: Booking status (generic)
    "booking_status": [
        (r"\b(status|track|where|check|find|locate|statut|suivre|où|vérifier|trouver|localiser).*\b(booking|reservation|ref|reference|réservation|référence)\b", "status_booking_explicit", 0.90),
        (r"\b(booking|reservation|ref|reference|réservation).*\b(status|track|where|check|statut|suivre|où)\b", "booking_status_reversed", 0.90),
        (r"\b(REF|ref)[-\s]?\d{3,}\b", "booking_ref_pattern", 0.85),
        (r"\b(where is|où est|quand|when).*\b(booking|reservation|my|ma|mon)\b", "where_booking", 0.82),
    ],
    
    # LOWEST PRIORITY: Smalltalk
    "smalltalk": [
        (r"^(ok|okay|d'accord|merci|thanks|thank you|oui|yes|non|no)([\s\!\.]|$)", "acknowledgment", 0.70),
        (r"^(good|bien|bon)([\s\!\.]|$)", "positive_short", 0.65),
        (r"\b(how are you|comment ça va|ça va)\b", "how_are_you", 0.75),
    ],
}


# ============================================================================
# Intent Detection Functions
# ============================================================================

def detect_intent(
    message: str,
    history: Optional[List[Dict[str, Any]]] = None,
    context: Optional[Dict[str, Any]] = None
) -> IntentResult:
    """
    Detect user intent from message with multilingual support.
    
    Args:
        message: User message
        history: Conversation history (for follow-up detection)
        context: Additional context (entities, user_role, etc.)
    
    Returns:
        IntentResult with intent, confidence, and reasoning
    """
    if not message or not message.strip():
        return IntentResult(
            intent="unknown",
            confidence=1.0,
            reasoning=["empty_message"],
            entities_hint={}
        )
    
    message_lower = message.lower().strip()
    message_words = message_lower.split()
    
    # Check all patterns in priority order
    all_matches: List[Tuple[str, float, List[str]]] = []
    
    for intent, patterns in INTENT_PATTERNS.items():
        intent_reasons = []
        intent_confidence = 0.0
        
        for pattern, rule_name, confidence in patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                intent_reasons.append(rule_name)
                intent_confidence = max(intent_confidence, confidence)
        
        if intent_reasons:
            all_matches.append((intent, intent_confidence, intent_reasons))
    
    # Sort by confidence (highest first)
    all_matches.sort(key=lambda x: x[1], reverse=True)
    
    # If we have a match, return highest confidence
    if all_matches:
        intent, confidence, reasons = all_matches[0]
        
        # Get entity hints for this intent
        entities_hint = _get_entity_hints(intent)
        
        logger.debug(f"Detected intent: {intent} (conf={confidence:.2f}, reasons={reasons})")
        
        return IntentResult(
            intent=intent,
            confidence=confidence,
            reasoning=reasons,
            entities_hint=entities_hint
        )
    
    # Check for follow-up patterns
    if history:
        is_short = len(message_words) <= 4
        has_follow_up_keyword = bool(re.search(
            r"\b(and|what about|then|also|too|same|yesterday|tomorrow|today|next|previous|et|puis|aussi|même|hier|demain|aujourd'hui)\b",
            message_lower,
            re.IGNORECASE
        ))
        
        if is_short or has_follow_up_keyword:
            last_intent = _get_last_intent(history)
            if last_intent and last_intent not in ("unknown", "help", "smalltalk"):
                return IntentResult(
                    intent=last_intent,
                    confidence=0.70,
                    reasoning=["follow_up_pattern", f"last_intent:{last_intent}"],
                    entities_hint=_get_entity_hints(last_intent)
                )
    
    # Unknown intent
    return IntentResult(
        intent="unknown",
        confidence=0.5,
        reasoning=["no_pattern_matched"],
        entities_hint={}
    )


def _get_last_intent(history: List[Dict[str, Any]]) -> Optional[str]:
    """Extract last non-generic intent from history."""
    if not history:
        return None
    
    for msg in reversed(history):
        if isinstance(msg, dict):
            intent = msg.get("intent") or msg.get("metadata", {}).get("intent")
            if intent and intent not in ("unknown", "help", "smalltalk", "forbidden", "not_implemented"):
                return intent
    
    return None


def _get_entity_hints(intent: str) -> Dict[str, Any]:
    """Get expected entities for an intent."""
    hints = {
        "booking_status": {"expected": ["booking_ref"], "optional": ["date"]},
        "slot_availability": {"expected": ["terminal", "date"], "optional": ["gate"]},
        "slot_recommendation": {"expected": ["terminal", "date"], "optional": ["gate", "carrier_id", "requested_time"]},

        "passage_history": {"expected": ["date"], "optional": ["terminal", "gate"]},

        "blockchain_audit": {"expected": ["booking_ref"], "optional": []},
        "operator_analytics_overview": {"expected": ["operator_id"], "optional": ["terminal", "range_days", "bucket"]},
    }
    return hints.get(intent, {"expected": [], "optional": []})


# ============================================================================
# Self-Test (run with: python -m app.orchestrator.intent_detector)
# ============================================================================

if __name__ == "__main__":
    print("Intent Detector - Self Test\n" + "=" * 50)
    
    test_cases = [
        # English
        ("What's the status of REF123?", "booking_status"),
        ("Show me available slots for terminal A tomorrow", "slot_availability"),
        ("Recommend a slot for terminal B", "slot_recommendation"),


        ("Show yesterday's truck passages", "passage_history"),

        ("Verify booking REF456 on blockchain", "blockchain_audit"),
        ("Help me", "help"),
        ("Hello", "help"),
        
        # French
        ("Quel est le statut de REF789?", "booking_status"),
        ("Disponibilité au terminal A demain", "slot_availability"),
        ("Suggère-moi un créneau pour terminal B", "slot_recommendation"),

        ("Historique des passages hier", "passage_history"),

        ("Bonjour", "help"),
        ("Merci", "smalltalk"),
        
        # Edge cases
        ("", "unknown"),
        ("asdfghjkl", "unknown"),
    ]
    
    passed = 0
    failed = 0
    
    for message, expected_intent in test_cases:
        result = detect_intent(message)
        status = "✓" if result.intent == expected_intent else "✗"
        
        if result.intent == expected_intent:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} '{message[:50]:50s}' -> {result.intent:20s} (expected: {expected_intent:20s}, conf={result.confidence:.2f})")
    
    print(f"\n{'=' * 50}")
    print(f"Results: {passed} passed, {failed} failed ({passed/(passed+failed)*100:.1f}% accuracy)")
