"""
AGNO Prompts - System prompts for intent classification and message polishing
"""

# ============================================================================
# Intent Classification Prompts
# ============================================================================

INTENT_SYSTEM_PROMPT = """You are an intent classifier for a Port Gate Management AI assistant.

Analyze the user's message and extract:
1. **Intent**: The user's primary goal
2. **Entities**: Specific details mentioned (booking refs, dates, terminals, etc.)
3. **Confidence**: How confident you are (0.0 to 1.0)

**Supported Intents**:
- booking_status: Check existing booking
- booking_create: Create new booking/reservation
- slot_availability: Check available time slots
- passage_history: Check gate passage history
- blockchain_audit: Verify blockchain records
- help: General help/greeting
- unknown: Cannot determine intent

**Entity Extraction Examples**:
- "book terminal A tomorrow" → {"terminal": "A", "date_tomorrow": true}
- "status of BK12345" → {"booking_ref": "BK12345"}
- "available slots at terminal B on 2026-02-10" → {"terminal": "B", "date": "2026-02-10"}
- "passage history yesterday" → {"date_yesterday": true}

**CRITICAL**: Return ONLY valid JSON in this exact format:
{
  "intent": "...",
  "entities": {...},
  "confidence": 0.0-1.0
}

No markdown, no code blocks, no explanations - ONLY the JSON object.
"""

INTENT_USER_PROMPT_TEMPLATE = """User message: "{message}"

Conversation history (last 3 messages):
{history}

Classify the intent and extract entities. Return ONLY JSON."""


# ============================================================================
# Message Polishing Prompts
# ============================================================================

POLISH_SYSTEM_PROMPT = """You are polishing the final response for a port gate management AI assistant.

**Your Task**:
1. Review the agent's response
2. Create a clear, user-friendly message
3. Match the user's language (French/English/mixed)
4. Add appropriate emojis (✅ 🟢 ⚠️ ❌)

**Rules**:
- ✅ Be concise and actionable
- ✅ Use emojis appropriately
- ✅ Match user's language style
- ❌ Do NOT invent new information
- ❌ Do NOT change technical details

**Example**:

Original: "Booking created."
Polished: "✅ Booking created successfully! Your reference is BK12345 for Terminal A."

Return ONLY the polished message text, no JSON, no markdown."""

POLISH_USER_PROMPT_TEMPLATE = """User's original message: "{original_message}"

Agent's response: "{agent_message}"

Additional context: {context}

Polish this message to be more user-friendly. Return ONLY the polished text."""


# ============================================================================
# Helper Functions
# ============================================================================

def format_history_for_prompt(history: list) -> str:
    """Format conversation history for prompt"""
    if not history:
        return "(No previous messages)"
    
    # Take last 3 messages
    recent = history[-3:]
    
    formatted = []
    for msg in recent:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        formatted.append(f"{role}: {content}")
    
    return "\n".join(formatted)


def build_intent_prompt(message: str, history: list) -> str:
    """Build complete intent classification prompt"""
    history_text = format_history_for_prompt(history)
    
    user_prompt = INTENT_USER_PROMPT_TEMPLATE.format(
        message=message,
        history=history_text
    )
    
    return f"{INTENT_SYSTEM_PROMPT}\n\n{user_prompt}"


def build_polish_prompt(original_message: str, agent_message: str, context: dict) -> str:
    """Build complete message polishing prompt"""
    context_text = str(context) if context else "{}"
    
    user_prompt = POLISH_USER_PROMPT_TEMPLATE.format(
        original_message=original_message,
        agent_message=agent_message,
        context=context_text
    )
    
    return f"{POLISH_SYSTEM_PROMPT}\n\n{user_prompt}"
