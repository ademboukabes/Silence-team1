"""
Operator Behavior Analysis

Analyzes operator decision patterns from historical action logs.
Detects over-acceptance, under-utilization, and congestion-linked behaviors.

Functions:
- analyze_operator_behavior: Main analysis function
- _calculate_decision_rates: Compute accept/reject/reschedule rates by bucket
- _detect_over_acceptance: Identify windows with excessive acceptance
- _detect_congestion_correlation: Find decision-congestion patterns
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


def analyze_operator_behavior(
    actions: List[Dict[str, Any]],
    throughput: List[Dict[str, Any]],
    plan: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze operator decision patterns and detect problematic behaviors.
    
    Args:
        actions: List of operator actions with fields:
            - timestamp, action, terminal, gate, slot_start, slot_end, capacity_delta
        throughput: List of throughput data with fields:
            - slot_start, slot_end, entered_trucks, avg_delay_minutes, congestion_events
        plan: List of planned slots with fields:
            - slot_start, slot_end, terminal, gate, planned_capacity
    
    Returns:
        {
            "patterns": List[Dict] - Detected behavioral patterns
            "suggestions": List[Dict] - Actionable recommendations
            "data_quality_notes": List[str] - Data quality issues
            "decision_stats": Dict - Overall decision statistics
        }
    """
    logger.info(f"Analyzing operator behavior: {len(actions)} actions, {len(throughput)} throughput records")
    
    if not actions:
        return {
            "patterns": [],
            "suggestions": [],
            "data_quality_notes": ["No operator actions available"],
            "decision_stats": {}
        }
    
    # Calculate decision rates by time bucket
    decision_rates = _calculate_decision_rates(actions)
    
    # Build capacity map from plan
    capacity_map = _build_capacity_map(plan)
    
    # Build congestion map from throughput
    congestion_map = _build_congestion_map(throughput)
    
    # Detect patterns
    patterns = []
    suggestions = []
    
    # Pattern 1: Over-acceptance during high-capacity periods
    over_acceptance_patterns = _detect_over_acceptance(
        decision_rates, capacity_map, congestion_map
    )
    patterns.extend(over_acceptance_patterns["patterns"])
    suggestions.extend(over_acceptance_patterns["suggestions"])
    
    # Pattern 2: Congestion correlation
    congestion_patterns = _detect_congestion_correlation(
        decision_rates, congestion_map
    )
    patterns.extend(congestion_patterns["patterns"])
    suggestions.extend(congestion_patterns["suggestions"])
    
    # Pattern 3: Inconsistent decision-making
    inconsistency_patterns = _detect_inconsistent_decisions(decision_rates)
    patterns.extend(inconsistency_patterns["patterns"])
    suggestions.extend(inconsistency_patterns["suggestions"])
    
    # Calculate overall stats
    total_actions = len(actions)
    action_counts = defaultdict(int)
    for action in actions:
        action_type = action.get("action", "UNKNOWN")
        action_counts[action_type] += 1
    
    decision_stats = {
        "total_actions": total_actions,
        "accept_count": action_counts.get("ACCEPT_BOOKING", 0),
        "reject_count": action_counts.get("REJECT_BOOKING", 0),
        "reschedule_count": action_counts.get("RESCHEDULE", 0),
        "override_count": action_counts.get("OVERRIDE_CAPACITY", 0),
        "accept_rate": action_counts.get("ACCEPT_BOOKING", 0) / total_actions if total_actions > 0 else 0.0,
        "reject_rate": action_counts.get("REJECT_BOOKING", 0) / total_actions if total_actions > 0 else 0.0
    }
    
    # Data quality notes
    data_quality_notes = []
    if len(actions) < 100:
        data_quality_notes.append(f"Limited action history ({len(actions)} actions)")
    if not throughput:
        data_quality_notes.append("No throughput data available for correlation")
    if not plan:
        data_quality_notes.append("No capacity plan available")
    
    return {
        "patterns": patterns,
        "suggestions": suggestions,
        "data_quality_notes": data_quality_notes,
        "decision_stats": decision_stats
    }


def _calculate_decision_rates(actions: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Calculate decision rates grouped by hour bucket.
    
    Returns:
        Dict[hour_str, {accept_count, reject_count, total, accept_rate, reject_rate}]
    """
    from app.tools.time_tool import parse_iso_datetime
    
    buckets = defaultdict(lambda: {"accept": 0, "reject": 0, "reschedule": 0, "total": 0})
    
    for action in actions:
        timestamp = action.get("timestamp") or action.get("slot_start")
        if not timestamp:
            continue
        
        dt = parse_iso_datetime(timestamp)
        if not dt:
            continue
        
        # Bucket by hour (e.g., "09:00")
        hour_bucket = f"{dt.hour:02d}:00"
        
        action_type = action.get("action", "")
        buckets[hour_bucket]["total"] += 1
        
        if "ACCEPT" in action_type:
            buckets[hour_bucket]["accept"] += 1
        elif "REJECT" in action_type:
            buckets[hour_bucket]["reject"] += 1
        elif "RESCHEDULE" in action_type:
            buckets[hour_bucket]["reschedule"] += 1
    
    # Calculate rates
    result = {}
    for hour, counts in buckets.items():
        total = counts["total"]
        result[hour] = {
            "accept_count": counts["accept"],
            "reject_count": counts["reject"],
            "reschedule_count": counts["reschedule"],
            "total": total,
            "accept_rate": counts["accept"] / total if total > 0 else 0.0,
            "reject_rate": counts["reject"] / total if total > 0 else 0.0,
            "reschedule_rate": counts["reschedule"] / total if total > 0 else 0.0
        }
    
    return result


def _build_capacity_map(plan: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Build map of hour -> average planned capacity.
    """
    from app.tools.time_tool import parse_iso_datetime
    
    capacity_by_hour = defaultdict(list)
    
    for slot in plan:
        slot_start = slot.get("slot_start")
        if not slot_start:
            continue
        
        dt = parse_iso_datetime(slot_start)
        if not dt:
            continue
        
        hour_bucket = f"{dt.hour:02d}:00"
        capacity = slot.get("planned_capacity", 0)
        capacity_by_hour[hour_bucket].append(capacity)
    
    # Average capacity per hour
    result = {}
    for hour, capacities in capacity_by_hour.items():
        result[hour] = sum(capacities) / len(capacities) if capacities else 0
    
    return result


def _build_congestion_map(throughput: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Build map of hour -> congestion metrics.
    """
    from app.tools.time_tool import parse_iso_datetime
    
    congestion_by_hour = defaultdict(lambda: {"delays": [], "congestion_events": 0, "count": 0})
    
    for record in throughput:
        slot_start = record.get("slot_start")
        if not slot_start:
            continue
        
        dt = parse_iso_datetime(slot_start)
        if not dt:
            continue
        
        hour_bucket = f"{dt.hour:02d}:00"
        
        avg_delay = record.get("avg_delay_minutes", 0)
        congestion_events = record.get("congestion_events", 0)
        
        congestion_by_hour[hour_bucket]["delays"].append(avg_delay)
        congestion_by_hour[hour_bucket]["congestion_events"] += congestion_events
        congestion_by_hour[hour_bucket]["count"] += 1
    
    # Calculate averages
    result = {}
    for hour, data in congestion_by_hour.items():
        delays = data["delays"]
        result[hour] = {
            "avg_delay": sum(delays) / len(delays) if delays else 0.0,
            "congestion_events": data["congestion_events"],
            "congestion_rate": data["congestion_events"] / data["count"] if data["count"] > 0 else 0.0
        }
    
    return result


def _detect_over_acceptance(
    decision_rates: Dict[str, Dict[str, Any]],
    capacity_map: Dict[str, int],
    congestion_map: Dict[str, Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detect time windows where operator over-accepts bookings.
    
    Criteria: accept_rate > 0.70 AND capacity utilization high AND delays present
    """
    patterns = []
    suggestions = []
    
    for hour, rates in decision_rates.items():
        accept_rate = rates["accept_rate"]
        capacity = capacity_map.get(hour, 0)
        congestion = congestion_map.get(hour, {})
        avg_delay = congestion.get("avg_delay", 0)
        
        # Over-acceptance threshold
        if accept_rate > 0.70 and capacity > 0 and avg_delay > 5.0:
            severity = min(1.0, (accept_rate - 0.70) / 0.30 * 0.5 + avg_delay / 20.0 * 0.5)
            
            patterns.append({
                "title": f"Over-acceptance at {hour}",
                "evidence": f"Accept rate {accept_rate*100:.0f}% with avg delay {avg_delay:.1f} min",
                "severity": round(severity, 2),
                "time_windows": [hour]
            })
            
            # Calculate recommended acceptance rate
            target_accept_rate = 0.65
            reduction_pct = int((accept_rate - target_accept_rate) * 100)
            
            suggestions.append({
                "title": f"Reduce acceptance during {hour}",
                "why": f"High acceptance ({accept_rate*100:.0f}%) causes delays of {avg_delay:.1f} min",
                "expected_impact": f"Reduce delays by ~{avg_delay * 0.4:.1f} minutes",
                "confidence": round(0.70 + severity * 0.15, 2),
                "actions": [
                    f"Limit acceptance to {target_accept_rate*100:.0f}% of requests during {hour}",
                    f"Spread {reduction_pct}% of bookings to adjacent time slots"
                ]
            })
    
    return {"patterns": patterns, "suggestions": suggestions}


def _detect_congestion_correlation(
    decision_rates: Dict[str, Dict[str, Any]],
    congestion_map: Dict[str, Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detect correlation between high acceptance and congestion events.
    """
    patterns = []
    suggestions = []
    
    # Find hours with both high acceptance and high congestion
    for hour, rates in decision_rates.items():
        accept_rate = rates["accept_rate"]
        congestion = congestion_map.get(hour, {})
        congestion_events = congestion.get("congestion_events", 0)
        
        if accept_rate > 0.75 and congestion_events > 0:
            severity = min(1.0, accept_rate * 0.6 + min(congestion_events / 5.0, 0.4))
            
            patterns.append({
                "title": f"Congestion linked to decisions at {hour}",
                "evidence": f"{congestion_events} congestion events with {accept_rate*100:.0f}% acceptance",
                "severity": round(severity, 2),
                "time_windows": [hour]
            })
            
            suggestions.append({
                "title": f"Implement stricter acceptance criteria at {hour}",
                "why": f"Acceptance decisions correlate with {congestion_events} congestion events",
                "expected_impact": f"Reduce congestion events by ~{int(congestion_events * 0.5)}",
                "confidence": 0.75,
                "actions": [
                    f"Review acceptance criteria for {hour} time window",
                    "Consider pre-booking requirements during peak hours"
                ]
            })
    
    return {"patterns": patterns, "suggestions": suggestions}


def _detect_inconsistent_decisions(
    decision_rates: Dict[str, Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detect inconsistent decision-making patterns (high variance in rates).
    """
    patterns = []
    suggestions = []
    
    if len(decision_rates) < 3:
        return {"patterns": patterns, "suggestions": suggestions}
    
    # Calculate variance in accept rates
    accept_rates = [rates["accept_rate"] for rates in decision_rates.values()]
    mean_rate = sum(accept_rates) / len(accept_rates)
    variance = sum((r - mean_rate) ** 2 for r in accept_rates) / len(accept_rates)
    std_dev = variance ** 0.5
    
    # High variance indicates inconsistency
    if std_dev > 0.25:
        patterns.append({
            "title": "Inconsistent acceptance patterns",
            "evidence": f"Accept rate varies significantly (std dev: {std_dev:.2f})",
            "severity": min(0.8, std_dev),
            "time_windows": list(decision_rates.keys())
        })
        
        suggestions.append({
            "title": "Standardize acceptance criteria",
            "why": "Inconsistent decision-making leads to unpredictable capacity utilization",
            "expected_impact": "Improve planning accuracy and reduce operational variance",
            "confidence": 0.68,
            "actions": [
                "Define clear acceptance thresholds per time window",
                "Implement decision support rules for operators"
            ]
        })
    
    return {"patterns": patterns, "suggestions": suggestions}
