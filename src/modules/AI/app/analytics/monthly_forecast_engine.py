"""
Monthly Forecast Engine

Forecasts next month's throughput and saturation risk using time-series analysis.
Uses seasonal naive baseline + EWMA smoothing for trend detection.

Functions:
- forecast_monthly_throughput: Main forecasting function
- calculate_saturation_risk: Risk scoring per slot
- simulate_capacity_boost: What-if capacity increase simulation
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


def forecast_monthly_throughput(
    historical_throughput: List[Dict[str, Any]],
    next_month: str,
    plan: List[Dict[str, Any]],
    lookback_weeks: int = 8
) -> Dict[str, Any]:
    """
    Forecast throughput for next month using time-series analysis.
    
    Args:
        historical_throughput: List of throughput records (6-12 weeks)
            - slot_start, slot_end, entered_trucks, avg_delay_minutes
        next_month: Target month (YYYY-MM)
        plan: Planned capacity for next month
            - slot_start, slot_end, planned_capacity, terminal, gate
        lookback_weeks: Number of weeks to analyze (default 8)
    
    Returns:
        {
            "month_predicted": str,
            "forecast_total_trucks": int,
            "expected_congested_slots_count": int,
            "expected_avg_delay": float,
            "month_alignment_score": int (0-100),
            "planning_quality": str (GOOD/RISK/CRITICAL),
            "high_risk_windows": List[Dict],
            "forecast_buckets": List[Dict]
        }
    """
    logger.info(f"Forecasting throughput for {next_month}: {len(historical_throughput)} historical records")
    
    if not historical_throughput:
        return _empty_forecast(next_month)
    
    # Build seasonal baseline (by weekday + hour)
    seasonal_baseline = _build_seasonal_baseline(historical_throughput)
    
    # Apply EWMA smoothing for trend
    trend_adjusted = _apply_ewma_trend(seasonal_baseline, alpha=0.3)
    
    # Generate forecast for next month
    forecast_buckets = _generate_monthly_forecast(next_month, trend_adjusted, plan)
    
    # Calculate risk metrics
    risk_analysis = calculate_saturation_risk(forecast_buckets, plan)
    
    # Calculate overall metrics
    forecast_total_trucks = sum(bucket["predicted_trucks"] for bucket in forecast_buckets)
    expected_avg_delay = sum(bucket["expected_delay"] for bucket in forecast_buckets) / len(forecast_buckets) if forecast_buckets else 0.0
    expected_congested_slots = sum(1 for bucket in forecast_buckets if bucket.get("saturation_risk", 0) > 0.75)
    
    # Month alignment score (0-100)
    alignment_score = _calculate_alignment_score(risk_analysis)
    
    # Planning quality
    if alignment_score >= 75:
        planning_quality = "GOOD"
    elif alignment_score >= 50:
        planning_quality = "RISK"
    else:
        planning_quality = "CRITICAL"
    
    return {
        "month_predicted": next_month,
        "forecast_total_trucks": forecast_total_trucks,
        "expected_congested_slots_count": expected_congested_slots,
        "expected_avg_delay": round(expected_avg_delay, 1),
        "month_alignment_score": alignment_score,
        "planning_quality": planning_quality,
        "high_risk_windows": risk_analysis["high_risk_windows"],
        "forecast_buckets": forecast_buckets[:100]  # Limit output size
    }


def calculate_saturation_risk(
    forecast_buckets: List[Dict[str, Any]],
    plan: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculate saturation risk for each forecasted bucket.
    
    Risk formula: sigmoid((predicted - planned) / max(planned, 1))
    
    Returns:
        {
            "high_risk_windows": List[Dict] (top 10 by risk),
            "risk_distribution": Dict[str, int] (count by risk level)
        }
    """
    high_risk_windows = []
    risk_distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    
    # Build plan map
    plan_map = {}
    for slot in plan:
        key = f"{slot.get('terminal')}_{slot.get('gate')}_{slot.get('slot_start')}"
        plan_map[key] = slot.get("planned_capacity", 0)
    
    for bucket in forecast_buckets:
        predicted = bucket["predicted_trucks"]
        slot_start = bucket["slot_start"]
        terminal = bucket.get("terminal", "UNKNOWN")
        gate = bucket.get("gate", "UNKNOWN")
        
        key = f"{terminal}_{gate}_{slot_start}"
        planned = plan_map.get(key, 0)
        
        if planned == 0:
            risk = 0.0
        else:
            # Sigmoid risk calculation
            delta = (predicted - planned) / max(planned, 1)
            risk = 1 / (1 + math.exp(-5 * delta))  # Sigmoid with steepness=5
        
        bucket["saturation_risk"] = round(risk, 3)
        bucket["planned_capacity"] = planned
        
        # Estimate delay based on saturation
        if risk > 0.75:
            expected_delay = 10 + (risk - 0.75) * 40  # 10-20 min delay
        elif risk > 0.50:
            expected_delay = 5 + (risk - 0.50) * 20
        else:
            expected_delay = risk * 10
        
        bucket["expected_delay"] = round(expected_delay, 1)
        
        # Categorize risk
        if risk >= 0.85:
            risk_distribution["critical"] += 1
        elif risk >= 0.70:
            risk_distribution["high"] += 1
        elif risk >= 0.50:
            risk_distribution["medium"] += 1
        else:
            risk_distribution["low"] += 1
        
        # Collect high-risk windows
        if risk > 0.75:
            high_risk_windows.append({
                "slot_start": slot_start,
                "slot_end": bucket.get("slot_end", ""),
                "terminal": terminal,
                "gate": gate,
                "predicted_trucks": predicted,
                "planned_capacity": planned,
                "saturation_risk": round(risk, 2),
                "expected_delay": round(expected_delay, 1)
            })
    
    # Sort high-risk windows by risk (highest first)
    high_risk_windows.sort(key=lambda x: x["saturation_risk"], reverse=True)
    
    return {
        "high_risk_windows": high_risk_windows[:10],  # Top 10
        "risk_distribution": risk_distribution
    }


def simulate_capacity_boost(
    forecast_buckets: List[Dict[str, Any]],
    plan: List[Dict[str, Any]],
    boost_pct: int
) -> Dict[str, Any]:
    """
    Simulate impact of capacity increase on saturation risk.
    
    Args:
        forecast_buckets: Forecasted buckets
        plan: Current capacity plan
        boost_pct: Percentage increase (e.g., 10 for 10%)
    
    Returns:
        {
            "boosted_plan": List[Dict] (updated plan),
            "risk_reduction": Dict (before/after comparison),
            "expected_improvement": str
        }
    """
    # Create boosted plan
    boosted_plan = []
    for slot in plan:
        boosted_slot = slot.copy()
        current_capacity = slot.get("planned_capacity", 0)
        boosted_capacity = int(current_capacity * (1 + boost_pct / 100.0))
        boosted_slot["planned_capacity"] = boosted_capacity
        boosted_plan.append(boosted_slot)
    
    # Recalculate risk with boosted plan
    original_risk = calculate_saturation_risk(forecast_buckets, plan)
    boosted_risk = calculate_saturation_risk(forecast_buckets, boosted_plan)
    
    # Compare
    original_high_risk_count = len(original_risk["high_risk_windows"])
    boosted_high_risk_count = len(boosted_risk["high_risk_windows"])
    reduction = original_high_risk_count - boosted_high_risk_count
    
    return {
        "boosted_plan": boosted_plan[:10],  # Sample
        "risk_reduction": {
            "before_high_risk_count": original_high_risk_count,
            "after_high_risk_count": boosted_high_risk_count,
            "reduction": reduction
        },
        "expected_improvement": f"Reduce high-risk windows by {reduction} ({reduction/max(original_high_risk_count, 1)*100:.0f}%)" if reduction > 0 else "No significant improvement"
    }


# ============================================================================
# Internal Helper Functions
# ============================================================================

def _empty_forecast(next_month: str) -> Dict[str, Any]:
    """Return empty forecast when no data available."""
    return {
        "month_predicted": next_month,
        "forecast_total_trucks": 0,
        "expected_congested_slots_count": 0,
        "expected_avg_delay": 0.0,
        "month_alignment_score": 0,
        "planning_quality": "UNKNOWN",
        "high_risk_windows": [],
        "forecast_buckets": [],
        "note": "Insufficient historical data for forecasting"
    }


def _build_seasonal_baseline(
    historical_throughput: List[Dict[str, Any]]
) -> Dict[str, List[int]]:
    """
    Build seasonal baseline by weekday + hour.
    
    Returns:
        Dict[(weekday, hour), List[truck_counts]]
    """
    from app.tools.time_tool import parse_iso_datetime
    
    baseline = defaultdict(list)
    
    for record in historical_throughput:
        slot_start = record.get("slot_start")
        if not slot_start:
            continue
        
        dt = parse_iso_datetime(slot_start)
        if not dt:
            continue
        
        weekday = dt.weekday()  # 0=Monday, 6=Sunday
        hour = dt.hour
        trucks = record.get("entered_trucks", 0)
        
        key = (weekday, hour)
        baseline[key].append(trucks)
    
    return baseline


def _apply_ewma_trend(
    seasonal_baseline: Dict[tuple, List[int]],
    alpha: float = 0.3
) -> Dict[tuple, float]:
    """
    Apply EWMA smoothing to detect trend.
    
    Args:
        seasonal_baseline: Dict[(weekday, hour), List[counts]]
        alpha: Smoothing factor (0-1)
    
    Returns:
        Dict[(weekday, hour), smoothed_average]
    """
    smoothed = {}
    
    for key, values in seasonal_baseline.items():
        if not values:
            smoothed[key] = 0.0
            continue
        
        # Simple average as baseline
        avg = sum(values) / len(values)
        
        # Apply EWMA if we have multiple values
        if len(values) > 1:
            ewma = values[0]
            for val in values[1:]:
                ewma = alpha * val + (1 - alpha) * ewma
            smoothed[key] = ewma
        else:
            smoothed[key] = avg
    
    return smoothed


def _generate_monthly_forecast(
    next_month: str,
    trend_data: Dict[tuple, float],
    plan: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate forecast buckets for next month based on trend data.
    
    Args:
        next_month: Target month (YYYY-MM)
        trend_data: Dict[(weekday, hour), predicted_trucks]
        plan: Capacity plan for next month
    
    Returns:
        List of forecast buckets
    """
    from app.tools.time_tool import parse_iso_datetime
    
    forecast_buckets = []
    
    # Parse month
    try:
        year, month = map(int, next_month.split('-'))
        start_date = datetime(year, month, 1)
        
        # Get last day of month
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
    except:
        logger.error(f"Invalid month format: {next_month}")
        return []
    
    # Generate forecast for each slot in plan
    for slot in plan:
        slot_start = slot.get("slot_start")
        if not slot_start:
            continue
        
        dt = parse_iso_datetime(slot_start)
        if not dt:
            continue
        
        # Check if slot is in target month
        if not (start_date <= dt < end_date):
            continue
        
        weekday = dt.weekday()
        hour = dt.hour
        key = (weekday, hour)
        
        # Get predicted trucks from trend data
        predicted_trucks = int(trend_data.get(key, 0))
        
        # Add some variance (±10%) for realism
        import random
        variance = random.uniform(0.9, 1.1)
        predicted_trucks = int(predicted_trucks * variance)
        
        forecast_buckets.append({
            "slot_start": slot_start,
            "slot_end": slot.get("slot_end", ""),
            "terminal": slot.get("terminal", "UNKNOWN"),
            "gate": slot.get("gate", "UNKNOWN"),
            "predicted_trucks": predicted_trucks,
            "weekday": weekday,
            "hour": hour
        })
    
    return forecast_buckets


def _calculate_alignment_score(risk_analysis: Dict[str, Any]) -> int:
    """
    Calculate month alignment score (0-100) based on risk distribution.
    
    Higher score = better alignment between plan and forecast.
    """
    dist = risk_analysis["risk_distribution"]
    
    total = sum(dist.values())
    if total == 0:
        return 50  # Neutral
    
    # Weighted score
    score = (
        dist["low"] * 100 +
        dist["medium"] * 70 +
        dist["high"] * 40 +
        dist["critical"] * 10
    ) / total
    
    return int(score)
