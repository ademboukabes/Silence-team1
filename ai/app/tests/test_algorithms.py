"""
Algorithm Tests

Tests for deterministic algorithm functions:
- slot_recommender.recommend_slots()

Run: pytest tests/test_algorithms.py -v
"""

import pytest
from datetime import datetime, timedelta


# ==================== Slot Recommender Tests ====================

def test_slot_recommender_normal_case():
    """Test slot recommendation with available candidates."""
    from app.algorithms.slot_recommender import recommend_slots
    
    # Create deterministic slot candidates
    base_time = datetime(2026, 2, 5, 9, 0, 0)
    
    candidates = [
        {
            "slot_id": "slot-001",
            "start": base_time.isoformat() + "Z",
            "end": (base_time + timedelta(hours=2)).isoformat() + "Z",
            "capacity": 20,
            "remaining": 15,
            "terminal": "A",
            "gate": "G1"
        },
        {
            "slot_id": "slot-002",
            "start": (base_time + timedelta(hours=3)).isoformat() + "Z",
            "end": (base_time + timedelta(hours=5)).isoformat() + "Z",
            "capacity": 15,
            "remaining": 10,
            "terminal": "A",
            "gate": "G2"
        },
        {
            "slot_id": "slot-003",
            "start": (base_time + timedelta(hours=6)).isoformat() + "Z",
            "end": (base_time + timedelta(hours=8)).isoformat() + "Z",
            "capacity": 10,
            "remaining": 2,
            "terminal": "A",
            "gate": "G1"
        }
    ]
    
    requested = {
        "start": base_time.isoformat() + "Z",
        "terminal": "A"
    }
    
    result = recommend_slots(requested, candidates)
    
    # Validate structure
    assert "recommended" in result
    assert "ranked" in result
    assert "strategy" in result
    assert "reasons" in result
    
    # Should have recommendations
    assert len(result["recommended"]) > 0
    assert len(result["ranked"]) == len(candidates)
    
    # Recommended slots should have rank_score
    for slot in result["recommended"]:
        assert "rank_score" in slot
        assert "rank_reasons" in slot


def test_slot_recommender_empty_candidates():
    """Test slot recommendation with no candidates (edge case)."""
    from app.algorithms.slot_recommender import recommend_slots
    
    requested = {
        "start": "2026-02-05T09:00:00Z",
        "terminal": "A"
    }
    
    candidates = []
    
    result = recommend_slots(requested, candidates)
    
    # Should handle empty candidates gracefully
    assert result["strategy"] == "no_candidates"
    assert len(result["recommended"]) == 0
    assert "No available slots" in result["reasons"][0]


def test_slot_recommender_low_carrier_score():
    """Test slot recommendation with low carrier score (buffer strategy)."""
    from app.algorithms.slot_recommender import recommend_slots
    
    base_time = datetime(2026, 2, 5, 9, 0, 0)
    
    candidates = [
        {
            "slot_id": "slot-001",
            "start": base_time.isoformat() + "Z",
            "end": (base_time + timedelta(hours=2)).isoformat() + "Z",
            "capacity": 20,
            "remaining": 15,
            "terminal": "A",
            "gate": "G1"
        },
        {
            "slot_id": "slot-002",
            "start": (base_time + timedelta(hours=6)).isoformat() + "Z",
            "end": (base_time + timedelta(hours=8)).isoformat() + "Z",
            "capacity": 15,
            "remaining": 10,
            "terminal": "A",
            "gate": "G2"
        }
    ]
    
    requested = {
        "start": (base_time + timedelta(hours=3)).isoformat() + "Z",
        "terminal": "A"
    }
    
    # Low carrier score should trigger buffer strategy
    result = recommend_slots(requested, candidates, carrier_score=55.0)
    
    # Should use buffer strategy for low carrier score
    assert result["strategy"] == "buffer_recommended"


def test_slot_recommender_no_capacity():
    """Test slot recommendation when all slots are full."""
    from app.algorithms.slot_recommender import recommend_slots
    
    base_time = datetime(2026, 2, 5, 9, 0, 0)
    
    candidates = [
        {
            "slot_id": "slot-001",
            "start": base_time.isoformat() + "Z",
            "end": (base_time + timedelta(hours=2)).isoformat() + "Z",
            "capacity": 20,
            "remaining": 0,  # Full
            "terminal": "A",
            "gate": "G1"
        }
    ]
    
    requested = {
        "start": base_time.isoformat() + "Z",
        "terminal": "A"
    }
    
    result = recommend_slots(requested, candidates)
    
    # Should handle no capacity gracefully
    assert result["strategy"] == "no_capacity"
    assert len(result["recommended"]) == 0


def test_slot_recommender_deterministic():
    """Test that slot recommendation is deterministic (no randomness)."""
    from app.algorithms.slot_recommender import recommend_slots
    
    base_time = datetime(2026, 2, 5, 9, 0, 0)
    
    candidates = [
        {
            "slot_id": f"slot-{i:03d}",
            "start": (base_time + timedelta(hours=i)).isoformat() + "Z",
            "end": (base_time + timedelta(hours=i+2)).isoformat() + "Z",
            "capacity": 20,
            "remaining": 15 - i,
            "terminal": "A",
            "gate": "G1"
        }
        for i in range(5)
    ]
    
    requested = {
        "start": base_time.isoformat() + "Z",
        "terminal": "A"
    }
    
    # Run twice and compare
    result1 = recommend_slots(requested, candidates, carrier_score=80.0)
    result2 = recommend_slots(requested, candidates, carrier_score=80.0)
    
    # Results should be identical
    assert result1["strategy"] == result2["strategy"]
    assert len(result1["recommended"]) == len(result2["recommended"])
    
    # Recommended slot IDs should be in same order
    ids1 = [s["slot_id"] for s in result1["recommended"]]
    ids2 = [s["slot_id"] for s in result2["recommended"]]
    assert ids1 == ids2


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
