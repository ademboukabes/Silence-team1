"""
Slot Capacity Analysis

Analyzes slot capacity vs actual throughput to detect under-utilization,
over-saturation, and capacity gaps.

Functions:
- analyze_capacity_utilization: Main analysis function
- _calculate_utilization: Compute utilization rates per slot
- _detect_under_utilized: Find under-utilized time windows
- _detect_over_saturated: Find over-saturated time windows
- _generate_capacity_recommendations: Create actionable recommendations
"""

import logging
from typing import Dict, Any, List, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


def analyze_capacity_utilization(
    plan: List[Dict[str, Any]],
    throughput: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze capacity utilization and generate recommendations.
    
    Args:
        plan: List of planned slots with fields:
            - slot_start, slot_end, terminal, gate, planned_capacity
        throughput: List of throughput data with fields:
            - slot_start, slot_end, terminal, gate, entered_trucks, avg_delay_minutes
    
    Returns:
        {
            "overall_utilization": float (0-1),
            "under_utilized_slots": List[Dict],
            "over_saturated_slots": List[Dict],
            "capacity_recommendations": List[Dict],
            "utilization_by_hour": Dict[str, float]
        }
    """
    logger.info(f"Analyzing capacity utilization: {len(plan)} planned slots, {len(throughput)} throughput records")
    
    if not plan:
        return {
            "overall_utilization": 0.0,
            "under_utilized_slots": [],
            "over_saturated_slots": [],
            "capacity_recommendations": [],
            "utilization_by_hour": {}
        }
    
    # Calculate utilization per slot
    utilization_data = _calculate_utilization(plan, throughput)
    
    # Detect patterns
    under_utilized = _detect_under_utilized(utilization_data)
    over_saturated = _detect_over_saturated(utilization_data)
    
    # Generate recommendations
    recommendations = _generate_capacity_recommendations(
        under_utilized, over_saturated, utilization_data
    )
    
    # Calculate overall utilization
    total_capacity = sum(slot["capacity"] for slot in utilization_data.values())
    total_used = sum(slot["used"] for slot in utilization_data.values())
    overall_utilization = total_used / total_capacity if total_capacity > 0 else 0.0
    
    # Utilization by hour
    utilization_by_hour = _aggregate_by_hour(utilization_data)
    
    return {
        "overall_utilization": round(overall_utilization, 3),
        "under_utilized_slots": under_utilized,
        "over_saturated_slots": over_saturated,
        "capacity_recommendations": recommendations,
        "utilization_by_hour": utilization_by_hour
    }


def _calculate_utilization(
    plan: List[Dict[str, Any]],
    throughput: List[Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    Calculate utilization for each slot.
    
    Returns:
        Dict[slot_key, {capacity, used, utilization, delay, gate, terminal, slot_start}]
    """
    from app.tools.time_tool import parse_iso_datetime
    
    # Build capacity map
    capacity_map = {}
    for slot in plan:
        slot_start = slot.get("slot_start")
        if not slot_start:
            continue
        
        gate = slot.get("gate", "UNKNOWN")
        terminal = slot.get("terminal", "UNKNOWN")
        capacity = slot.get("planned_capacity", 0)
        
        key = f"{terminal}_{gate}_{slot_start}"
        capacity_map[key] = {
            "capacity": capacity,
            "used": 0,
            "delay": 0.0,
            "gate": gate,
            "terminal": terminal,
            "slot_start": slot_start
        }
    
    # Add throughput data
    for record in throughput:
        slot_start = record.get("slot_start")
        if not slot_start:
            continue
        
        gate = record.get("gate", "UNKNOWN")
        terminal = record.get("terminal", "UNKNOWN")
        entered_trucks = record.get("entered_trucks", 0)
        avg_delay = record.get("avg_delay_minutes", 0.0)
        
        key = f"{terminal}_{gate}_{slot_start}"
        
        if key in capacity_map:
            capacity_map[key]["used"] = entered_trucks
            capacity_map[key]["delay"] = avg_delay
        else:
            # Throughput without plan - create entry
            capacity_map[key] = {
                "capacity": 0,
                "used": entered_trucks,
                "delay": avg_delay,
                "gate": gate,
                "terminal": terminal,
                "slot_start": slot_start
            }
    
    # Calculate utilization
    for key, data in capacity_map.items():
        capacity = data["capacity"]
        used = data["used"]
        data["utilization"] = used / capacity if capacity > 0 else 0.0
    
    return capacity_map


def _detect_under_utilized(
    utilization_data: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detect under-utilized slots (< 50% utilization).
    """
    from app.tools.time_tool import parse_iso_datetime
    
    under_utilized = []
    
    for key, data in utilization_data.items():
        utilization = data["utilization"]
        capacity = data["capacity"]
        used = data["used"]
        
        if capacity > 0 and utilization < 0.50:
            # Calculate opportunity (unused capacity)
            opportunity = capacity - used
            
            # Parse time for display
            dt = parse_iso_datetime(data["slot_start"])
            slot_display = f"{dt.strftime('%H:%M')}" if dt else data["slot_start"]
            
            under_utilized.append({
                "slot": slot_display,
                "gate": data["gate"],
                "terminal": data["terminal"],
                "utilization": round(utilization, 2),
                "capacity": capacity,
                "used": used,
                "opportunity": opportunity,
                "opportunity_text": f"Add {opportunity} trucks"
            })
    
    # Sort by opportunity (highest first)
    under_utilized.sort(key=lambda x: x["opportunity"], reverse=True)
    
    return under_utilized[:10]  # Top 10


def _detect_over_saturated(
    utilization_data: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detect over-saturated slots (> 90% utilization with delays).
    """
    from app.tools.time_tool import parse_iso_datetime
    
    over_saturated = []
    
    for key, data in utilization_data.items():
        utilization = data["utilization"]
        capacity = data["capacity"]
        delay = data["delay"]
        
        if utilization > 0.90 and delay > 3.0:
            # Parse time for display
            dt = parse_iso_datetime(data["slot_start"])
            slot_display = f"{dt.strftime('%H:%M')}" if dt else data["slot_start"]
            
            over_saturated.append({
                "slot": slot_display,
                "gate": data["gate"],
                "terminal": data["terminal"],
                "utilization": round(utilization, 2),
                "capacity": capacity,
                "used": data["used"],
                "avg_delay": round(delay, 1),
                "severity": min(1.0, (utilization - 0.90) / 0.10 * 0.5 + delay / 20.0 * 0.5)
            })
    
    # Sort by severity (highest first)
    over_saturated.sort(key=lambda x: x["severity"], reverse=True)
    
    return over_saturated[:10]  # Top 10


def _generate_capacity_recommendations(
    under_utilized: List[Dict[str, Any]],
    over_saturated: List[Dict[str, Any]],
    utilization_data: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate actionable capacity recommendations.
    """
    recommendations = []
    
    # Recommendation 1: Increase capacity for over-saturated slots
    for slot in over_saturated[:5]:  # Top 5
        current_capacity = slot["capacity"]
        avg_delay = slot["avg_delay"]
        
        # Recommend 15-20% increase
        increase_pct = 0.15 if avg_delay < 10 else 0.20
        recommended_capacity = int(current_capacity * (1 + increase_pct))
        
        # Estimate benefit
        delay_reduction = avg_delay * 0.5  # Assume 50% reduction
        
        recommendations.append({
            "action": "Increase capacity",
            "slot": slot["slot"],
            "gate": slot["gate"],
            "terminal": slot["terminal"],
            "current_capacity": current_capacity,
            "recommended_capacity": recommended_capacity,
            "expected_benefit": f"Reduce delay from {avg_delay:.0f}min to {avg_delay - delay_reduction:.0f}min",
            "priority": "HIGH" if avg_delay > 10 else "MEDIUM"
        })
    
    # Recommendation 2: Redistribute load from over-saturated to under-utilized
    if over_saturated and under_utilized:
        for over_slot in over_saturated[:3]:
            # Find under-utilized slot in same terminal
            matching_under = [
                u for u in under_utilized
                if u["terminal"] == over_slot["terminal"]
            ]
            
            if matching_under:
                under_slot = matching_under[0]
                
                # Calculate redistribution
                excess = over_slot["used"] - int(over_slot["capacity"] * 0.85)
                available = under_slot["opportunity"]
                redistribute = min(excess, available)
                
                if redistribute > 0:
                    recommendations.append({
                        "action": "Redistribute load",
                        "from_slot": over_slot["slot"],
                        "from_gate": over_slot["gate"],
                        "to_slot": under_slot["slot"],
                        "to_gate": under_slot["gate"],
                        "terminal": over_slot["terminal"],
                        "trucks_to_move": redistribute,
                        "expected_benefit": f"Balance utilization and reduce delays at {over_slot['slot']}",
                        "priority": "MEDIUM"
                    })
    
    # Recommendation 3: Reduce capacity for consistently under-utilized slots
    for slot in under_utilized[:3]:
        if slot["utilization"] < 0.30 and slot["capacity"] > 20:
            # Recommend 20-30% reduction
            reduction_pct = 0.25
            recommended_capacity = int(slot["capacity"] * (1 - reduction_pct))
            
            recommendations.append({
                "action": "Reduce capacity",
                "slot": slot["slot"],
                "gate": slot["gate"],
                "terminal": slot["terminal"],
                "current_capacity": slot["capacity"],
                "recommended_capacity": recommended_capacity,
                "expected_benefit": f"Free up resources (only {slot['utilization']*100:.0f}% utilized)",
                "priority": "LOW"
            })
    
    return recommendations


def _aggregate_by_hour(
    utilization_data: Dict[str, Dict[str, Any]]
) -> Dict[str, float]:
    """
    Aggregate utilization by hour.
    """
    from app.tools.time_tool import parse_iso_datetime
    
    by_hour = defaultdict(lambda: {"total_capacity": 0, "total_used": 0})
    
    for key, data in utilization_data.items():
        dt = parse_iso_datetime(data["slot_start"])
        if not dt:
            continue
        
        hour = f"{dt.hour:02d}:00"
        by_hour[hour]["total_capacity"] += data["capacity"]
        by_hour[hour]["total_used"] += data["used"]
    
    # Calculate utilization per hour
    result = {}
    for hour, totals in by_hour.items():
        capacity = totals["total_capacity"]
        used = totals["total_used"]
        result[hour] = round(used / capacity, 3) if capacity > 0 else 0.0
    
    return result
