"""
Agents Package

Specialized agents for handling different types of user intents.
Each agent inherits from BaseAgent and implements business logic for its domain.

Available Agents:
- BookingAgent: Booking status queries
- SlotAgent: Slot availability and management
- CarrierScoreAgent: Carrier reliability scoring
- TrafficAgent: Traffic forecasts and congestion
- AnomalyAgent: Anomaly detection and analysis
- RecommendationAgent: AI-powered slot recommendations
- BlockchainAuditAgent: Blockchain audit trail verification

Registry:
- get_agent(name): Get agent instance by name
- list_agents(): List all available agents
"""

# Export base agent
from app.agents.base_agent import BaseAgent

# Export agent registry functions
from app.agents.registry import (
    get_agent,
    list_agents,
    AGENT_REGISTRY
)

# Export agent classes (with safe imports)
try:
    from app.agents.booking_agent import BookingAgent
except ImportError:
    BookingAgent = None

try:
    from app.agents.slot_agent import SlotAgent
except ImportError:
    SlotAgent = None

try:
    from app.agents.blockchain_audit_agent import BlockchainAuditAgent
except ImportError:
    BlockchainAuditAgent = None


__all__ = [
    "BaseAgent",
    "get_agent",
    "list_agents",
    "AGENT_REGISTRY",
    "BookingAgent",
    "SlotAgent",
    "BlockchainAuditAgent",
]
