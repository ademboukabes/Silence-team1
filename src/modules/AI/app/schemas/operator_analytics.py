"""
Operator Analytics Schemas

Pydantic models for operator analytics requests and responses.
All models use explicit defaults (NO Ellipsis) for OpenAPI compatibility.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


# ============================================================================
# Request Models
# ============================================================================

class OperatorAnalyticsRequest(BaseModel):
    """Request for operator analytics overview."""
    operator_id: str = Field(..., description="Operator identifier")
    terminal: Optional[str] = Field(None, description="Terminal filter (A, B, C, etc.)")
    range_days: int = Field(30, description="Historical range in days (default 30)")
    bucket: str = Field("1h", description="Time bucket size (default 1h)")
    use_llm: bool = Field(True, description="Use AGNO for narrative polishing")


class MonthlyForecastRequest(BaseModel):
    """Request for monthly throughput forecast."""
    operator_id: str = Field(..., description="Operator identifier")
    month: str = Field(..., description="Target month (YYYY-MM)")
    terminal: Optional[str] = Field(None, description="Terminal filter")
    bucket: str = Field("1h", description="Time bucket size (default 1h)")
    capacity_boost_pct: int = Field(0, description="Capacity increase percentage for what-if simulation")


# ============================================================================
# Data Models
# ============================================================================

class OperatorBehaviorPattern(BaseModel):
    """Detected operator behavior pattern."""
    title: str
    evidence: str
    severity: float = Field(..., ge=0.0, le=1.0, description="Severity score 0-1")
    time_windows: List[str]


class CapacityRecommendation(BaseModel):
    """Capacity adjustment recommendation."""
    action: str = Field(..., description="Action type (Increase/Reduce/Redistribute)")
    slot: str = Field(..., description="Time slot")
    gate: str
    terminal: str
    current_capacity: int
    recommended_capacity: int
    expected_benefit: str
    priority: str = Field("MEDIUM", description="Priority level (LOW/MEDIUM/HIGH)")


class ForecastBucket(BaseModel):
    """Single forecast bucket."""
    slot_start: str
    slot_end: str
    terminal: str
    gate: str
    predicted_trucks: int
    planned_capacity: int
    saturation_risk: float = Field(..., ge=0.0, le=1.0)
    expected_delay: float


class HighRiskWindow(BaseModel):
    """High-risk time window."""
    slot_start: str
    slot_end: str
    terminal: str
    gate: str
    predicted_trucks: int
    planned_capacity: int
    saturation_risk: float
    expected_delay: float


# ============================================================================
# Response Models
# ============================================================================

class OperatorAnalyticsData(BaseModel):
    """Data payload for operator analytics response."""
    operator_id: str
    terminal: Optional[str] = None
    month_analyzed: str
    operator_management_score: int = Field(..., ge=0, le=100, description="BA score 0-100")
    planning_quality: str = Field(..., description="GOOD / RISK / CRITICAL")
    
    # Behavior analysis
    patterns: List[OperatorBehaviorPattern]
    suggestions: List[Dict[str, Any]]
    decision_stats: Dict[str, Any]
    
    # Capacity analysis
    overall_utilization: float
    under_utilized_slots: List[Dict[str, Any]]
    over_saturated_slots: List[Dict[str, Any]]
    capacity_recommendations: List[CapacityRecommendation]
    
    # Optional: Executive summary (if AGNO used)
    executive_summary: Optional[str] = None
    key_findings: Optional[List[str]] = None
    risk_level: Optional[str] = None


class OperatorAnalyticsResponse(BaseModel):
    """Response for operator analytics overview."""
    message: str
    data: OperatorAnalyticsData
    proofs: Dict[str, Any]


class MonthlyForecastData(BaseModel):
    """Data payload for monthly forecast response."""
    operator_id: str
    terminal: Optional[str] = None
    month_predicted: str
    forecast_total_trucks: int
    expected_congested_slots_count: int
    expected_avg_delay: float
    month_alignment_score: int = Field(..., ge=0, le=100)
    planning_quality: str
    high_risk_windows: List[HighRiskWindow]
    forecast_buckets: List[ForecastBucket]
    
    # Optional: What-if simulation results
    simulation_results: Optional[Dict[str, Any]] = None


class MonthlyForecastResponse(BaseModel):
    """Response for monthly forecast."""
    message: str
    data: MonthlyForecastData
    proofs: Dict[str, Any]


# ============================================================================
# Error Response Models
# ============================================================================

class BackendDependencyError(BaseModel):
    """Error when backend dependency is missing."""
    error: str = "backend_dependency_missing"
    missing_endpoint: str
    required_endpoints: List[str]
    suggestion: str


class OperatorAnalyticsErrorResponse(BaseModel):
    """Error response for operator analytics."""
    message: str
    data: BackendDependencyError
    proofs: Dict[str, Any]
