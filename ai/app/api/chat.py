"""
Chat API Endpoints

Intelligent orchestrator that delegates persistence to NestJS backend.
Backend is the SINGLE SOURCE OF TRUTH for conversations and messages.

Endpoints:
- POST /chat - Send message to AI assistant
- GET /chat/history/{conversation_id} - Get conversation history
- DELETE /chat/history/{conversation_id} - Delete conversation
"""

import logging
import inspect
import os
import uuid
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException, Request, Query, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================================
# CONFIGURATION
# ============================================================================

ALLOWED_ROLES = {"ADMIN", "OPERATOR", "CARRIER"}

# IMPORTANT: set these to match your NestJS backend message role enum
MESSAGE_ROLE_USER = os.getenv("MESSAGE_ROLE_USER", "USER")
MESSAGE_ROLE_ASSISTANT = os.getenv("MESSAGE_ROLE_ASSISTANT", "ASSISTANT")

# ============================================================================
# Schemas
# ============================================================================

try:
    from app.schemas.chat import ChatRequest, ChatResponse
    SCHEMAS_AVAILABLE = True
except ImportError:
    logger.warning("Chat schemas not found - using fallback definitions")
    SCHEMAS_AVAILABLE = False

    class ChatRequest(BaseModel):
        message: str = Field(description="User message")
        user_id: int = Field(description="User ID")
        user_role: str = Field(description="User role: ADMIN, OPERATOR, CARRIER")
        conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
        context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

    class ChatResponse(BaseModel):
        conversation_id: str
        message: str
        intent: Optional[str] = None
        data: Optional[Dict[str, Any]] = None
        proofs: Optional[Dict[str, Any]] = None

# ============================================================================
# Nest client
# ============================================================================

try:
    from app.tools.nest_client import (
        create_conversation,
        add_message,
        get_conversation_history,
        delete_conversation,
    )
    NEST_CLIENT_AVAILABLE = True
except ImportError:
    logger.error("nest_client not available - backend communication will fail")
    NEST_CLIENT_AVAILABLE = False

    async def create_conversation(user_id: int, user_role: str, auth_header: Optional[str] = None):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Backend client not configured")

    async def add_message(
        conversation_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None,
        metadata: Optional[Dict] = None,
        auth_header: Optional[str] = None,
    ):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Backend client not configured")

    async def get_conversation_history(
        conversation_id: str,
        limit: int = 10,
        offset: int = 0,
        auth_header: Optional[str] = None,
    ):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Backend client not configured")

    async def delete_conversation(conversation_id: str, auth_header: Optional[str] = None):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Backend client not configured")

# ============================================================================
# Orchestrator
# ============================================================================

try:
    from app.orchestrator.orchestrator import Orchestrator
    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    logger.warning("Orchestrator not available - using placeholder responses")
    ORCHESTRATOR_AVAILABLE = False
    Orchestrator = None  # type: ignore

logger.info(
    f"Chat API ready - Schemas: {SCHEMAS_AVAILABLE}, Backend: {NEST_CLIENT_AVAILABLE}, Orchestrator: {ORCHESTRATOR_AVAILABLE}"
)

# ============================================================================
# Helpers
# ============================================================================

def _extract_conversation_id(conversation: Dict[str, Any]) -> Optional[str]:
    return (
        conversation.get("id")
        or conversation.get("conversationId")
        or conversation.get("data", {}).get("id")
        or conversation.get("data", {}).get("conversationId")
    )

def _extract_messages(conversation_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Backend may return messages in different shapes:
      - {"messages": [...]}
      - {"data": {"messages": [...]}}
      - {"items": [...]}
    """
    msgs = (
        conversation_payload.get("messages")
        or conversation_payload.get("data", {}).get("messages")
        or conversation_payload.get("items")
        or []
    )
    if isinstance(msgs, list):
        return [m for m in msgs if isinstance(m, dict)]
    return []

def _normalize_history(raw_messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalize backend messages to orchestrator-friendly format:
      - role: "user" | "assistant"
      - content: string
    Unknown roles are ignored (safer for orchestrator).
    """
    normalized: List[Dict[str, Any]] = []

    for msg in raw_messages:
        role_raw = msg.get("role", "")
        role = role_raw.upper() if isinstance(role_raw, str) else ""

        if role in {MESSAGE_ROLE_USER.upper(), "USER"}:
            norm_role = "user"
        elif role in {MESSAGE_ROLE_ASSISTANT.upper(), "ASSISTANT"}:
            norm_role = "assistant"
        elif isinstance(role_raw, str) and role_raw.lower() in {"user", "assistant"}:
            norm_role = role_raw.lower()
        else:
            # Ignore system/unknown roles to avoid breaking orchestrator
            continue

        content = msg.get("content") or msg.get("message") or msg.get("text") or ""
        content = str(content).strip()

        normalized_msg = {"role": norm_role, "content": content}

        # Keep other fields if useful (timestamps, ids, etc.)
        for k, v in msg.items():
            if k not in {"role", "content", "message", "text"}:
                normalized_msg[k] = v

        normalized.append(normalized_msg)

    return normalized

async def _call_orchestrator(
    message: str,
    history: List[Dict[str, Any]],
    user_role: str,
    user_id: int,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not ORCHESTRATOR_AVAILABLE or Orchestrator is None:
        return {
            "message": "AI service is starting up. Please try again in a moment.",
            "intent": "system_status",
            "data": {"status": "initializing"},
            "proofs": None,
        }

    orchestrator = Orchestrator()

    params = {
        "message": message,
        "history": history,
        "user_role": user_role,
        "user_id": user_id,
        "context": context or {},
    }

    method = None
    if hasattr(orchestrator, "handle_message"):
        method = orchestrator.handle_message
    elif hasattr(orchestrator, "handle"):
        method = orchestrator.handle
    elif hasattr(orchestrator, "process"):
        method = orchestrator.process

    if not method:
        return {"message": "AI service configuration error.", "intent": "error", "data": None, "proofs": None}

    try:
        if inspect.iscoroutinefunction(method):
            result = await method(**params)
        else:
            result = method(**params)

        if inspect.isawaitable(result):
            result = await result

        return result if isinstance(result, dict) else {"message": str(result), "intent": "unknown", "data": None, "proofs": None}
    except Exception as e:
        logger.exception(f"Orchestrator error: {e}")
        return {"message": "I encountered an error processing your request. Please try again.", "intent": "error", "data": {"error": str(e)}, "proofs": None}

# ============================================================================
# Routes
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    http_request: Request,
    llm: bool = Query(default=True, description="Use LLM orchestration (set to false for deterministic mode)")
):
    print(os.environ)
    role = request.user_role.strip().upper()
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user_role. Must be one of: {', '.join(sorted(ALLOWED_ROLES))}",
        )

    auth_header = http_request.headers.get("Authorization")

    conversation_id = request.conversation_id
    trace_id = str(uuid.uuid4())[:8]
    
    if not conversation_id:
        # Pass None as user_id since test users may not exist in database
        # Backend accepts optional userId - only include if user exists
        try:
            logger.info(f"[{trace_id}] Creating conversation for role={role}, user_id=None")
            conversation = await create_conversation(user_id=None, user_role=role, auth_header=auth_header)
            conversation_id = _extract_conversation_id(conversation)
            logger.info(f"[{trace_id}] ✅ Conversation created successfully: {conversation_id}")
            
            if not conversation_id:
                logger.error(f"[{trace_id}] Backend returned conversation without ID: {conversation}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": "backend_invalid_response",
                        "message": "Backend returned conversation data without ID",
                        "trace_id": trace_id
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            logger.error(f"[{trace_id}] ❌ Failed to create conversation: {error_type}: {error_msg}")
            
            # Import to get backend URL
            from app.tools import nest_client
            
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "backend_chat_persistence_failed",
                    "operation": "create_conversation",
                    "backend_url": nest_client.NEST_BACKEND_URL,
                    "error_type": error_type,
                    "message": error_msg,
                    "trace_id": trace_id
                }
            )

    # Save user message
    try:
        await add_message(
            conversation_id=conversation_id,
            role=MESSAGE_ROLE_USER,
            content=request.message,
            intent=None,
            metadata=request.context or {},
            auth_header=auth_header,
        )
    except Exception as e:
        logger.warning(f"Failed to save user message: {e}")

    # Get history (best-effort)
    raw_history: List[Dict[str, Any]] = []
    try:
        payload = await get_conversation_history(conversation_id=conversation_id, limit=10, offset=0, auth_header=auth_header)
        raw_history = _extract_messages(payload)
    except Exception as e:
        logger.warning(f"Failed to fetch history: {e}")

    normalized_history = _normalize_history(raw_history)

    # Step 7: Process through Orchestrator
    # Build context with auth_header for agents that need it (e.g., BookingAgent)
    orchestrator_context = {
        "auth_header": auth_header,
        "force_deterministic": not llm  # Allow forcing deterministic mode for debugging
    }
    if request.context:
        # Merge user-provided context, but ensure auth_header is set
        orchestrator_context.update(request.context)
        orchestrator_context["auth_header"] = auth_header
        orchestrator_context["force_deterministic"] = not llm
    
    orchestrator_result = await _call_orchestrator(
        message=request.message,
        history=normalized_history,  # Use normalized history
        user_role=role,  # Use normalized role
        user_id=request.user_id,
        context=orchestrator_context
    )

    ai_message = orchestrator_result.get("message", "I could not process your request.")
    intent = orchestrator_result.get("intent")
    data = orchestrator_result.get("data")
    proofs = orchestrator_result.get("proofs")

    # Save assistant message (best-effort)
    try:
        await add_message(
            conversation_id=conversation_id,
            role=MESSAGE_ROLE_ASSISTANT,
            content=ai_message,
            intent=intent,
            metadata={"data": data, "proofs": proofs, "user_role": role},
            auth_header=auth_header,
        )
    except Exception as e:
        logger.error(f"Failed to save AI response: {e}")

    return ChatResponse(conversation_id=conversation_id, message=ai_message, intent=intent, data=data, proofs=proofs)


@router.get("/chat/history/{conversation_id}")
async def get_history(conversation_id: str, http_request: Request, limit: int = 10, offset: int = 0):
    auth_header = http_request.headers.get("Authorization")
    try:
        # If backend doesn't support offset, your nest_client should ignore it or you remove it there.
        return await get_conversation_history(conversation_id=conversation_id, limit=limit, offset=offset, auth_header=auth_header)
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Failed to retrieve conversation history: {str(e)}")


@router.delete("/chat/history/{conversation_id}")
async def delete_history(conversation_id: str, http_request: Request):
    auth_header = http_request.headers.get("Authorization")
    try:
        await delete_conversation(conversation_id=conversation_id, auth_header=auth_header)
        return {"success": True, "conversation_id": conversation_id, "message": "Conversation deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete conversation: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Failed to delete conversation: {str(e)}")
