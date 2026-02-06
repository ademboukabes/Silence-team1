"""
Analytics Package

Provides advanced analytics features for smart port operations:
- Stress Index: Real-time congestion/pressure scoring (0-100)
- Proactive Alerts: Automated operational alerts
- What-If Simulations: Scenario modeling for decision support
- Operator Behavior Analysis: Decision pattern detection
- Capacity Analysis: Utilization and saturation detection
- Monthly Forecasting: Time-series based throughput prediction

All features use REAL backend data when available with graceful MVP fallback.
"""

from app.analytics.stress_index import compute_stress_index, stress_level
from app.analytics.proactive_alerts import generate_alerts, alert_severity_score
from app.analytics.what_if_simulation import simulate_scenario
from app.analytics.operator_behavior_analysis import analyze_operator_behavior
from app.analytics.slot_capacity_analysis import analyze_capacity_utilization
from app.analytics.monthly_forecast_engine import (
    forecast_monthly_throughput,
    calculate_saturation_risk,
    simulate_capacity_boost
)

__all__ = [
    "compute_stress_index",
    "stress_level",
    "generate_alerts",
    "alert_severity_score",
    "simulate_scenario",
    "analyze_operator_behavior",
    "analyze_capacity_utilization",
    "forecast_monthly_throughput",
    "calculate_saturation_risk",
    "simulate_capacity_boost"
]
