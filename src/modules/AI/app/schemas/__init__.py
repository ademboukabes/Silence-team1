"""
Pydantic Schemas Package

Provides typed request/response models for FastAPI AI service endpoints.
All schemas match existing agent/model/service client response structures.

Schema Conventions:
- BaseAgent responses: {message: str, data: dict, proofs: Proofs}
- Model outputs: {ok: bool, result/error: dict, proofs: Proofs}
- Service clients: Normalized dicts with specific keys per service

Export Groups:
- Base: Proofs, AgentResponse, ErrorResponse
- Chat: ChatRequest, ChatResponse
- Slot: SlotRecommendation schemas
- Analytics: Stress, Alerts, WhatIf schemas
- Traffic: TrafficForecast schemas
- Anomaly: AnomalyDetection schemas
- Blockchain: BlockchainAudit schemas
- OperatorAnalytics: Operator analytics and forecasting schemas
"""

# Base schemas
from app.schemas.base import (
    Proofs,
    AgentResponse,
    ErrorResponse,
    ValidationErrorResponse
)

# Chat schemas
from app.schemas.chat import (
    ChatRequest,
    ChatResponse
)



# Slot/recommendation schemas
from app.schemas.recommend import (
    SlotItem,
    SlotRecommendationResult,
    SlotAvailabilityResponse,
    SlotRecommendationResponse
)

# Analytics/stress schemas
from app.schemas.stress import (
    StressDrivers,
    StressIndexResult,
    StressIndexResponse,
    AlertItem,
    AlertsResponse,
    WhatIfScenario,
    WhatIfResult,
    WhatIfResponse
)

# Traffic schemas
from app.schemas.traffic import (
    TrafficForecastResult,
    TrafficResponse
)

# Anomaly schemas
from app.schemas.anomalies import (
    AnomalyItem,
    AnomaliesResponse
)

# Blockchain schemas
from app.schemas.blockchain import (
    BlockchainAuditRequest,
    BlockchainAuditResult,
    BlockchainAuditResponse
)

# Operator Analytics schemas
from app.schemas.operator_analytics import (
    OperatorAnalyticsRequest,
    MonthlyForecastRequest,
    OperatorBehaviorPattern,
    CapacityRecommendation,
    ForecastBucket,
    HighRiskWindow,
    OperatorAnalyticsData,
    OperatorAnalyticsResponse,
    MonthlyForecastData,
    MonthlyForecastResponse,
    BackendDependencyError,
    OperatorAnalyticsErrorResponse
)

__all__ = [
    # Base
    "Proofs",
    "AgentResponse",
    "ErrorResponse",
    "ValidationErrorResponse",
    # Chat
    "ChatRequest",
    "ChatResponse",

    # Slot/Recommend
    "SlotItem",
    "SlotRecommendationResult",
    "SlotAvailabilityResponse",
    "SlotRecommendationResponse",
    # Analytics/Stress
    "StressDrivers",
    "StressIndexResult",
    "StressIndexResponse",
    "AlertItem",
    "AlertsResponse",
    "WhatIfScenario",
    "WhatIfResult",
    "WhatIfResponse",
    # Traffic
    "TrafficForecastResult",
    "TrafficResponse",
    # Anomaly
    "AnomalyItem",
    "AnomaliesResponse",
    # Blockchain
    "BlockchainAuditRequest",
    "BlockchainAuditResult",
    "BlockchainAuditResponse",
    # Operator Analytics
    "OperatorAnalyticsRequest",
    "MonthlyForecastRequest",
    "OperatorBehaviorPattern",
    "CapacityRecommendation",
    "ForecastBucket",
    "HighRiskWindow",
    "OperatorAnalyticsData",
    "OperatorAnalyticsResponse",
    "MonthlyForecastData",
    "MonthlyForecastResponse",
    "BackendDependencyError",
    "OperatorAnalyticsErrorResponse"
]
