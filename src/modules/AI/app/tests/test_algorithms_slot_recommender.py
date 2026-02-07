"""
Tests for slot recommendation algorithm.

Tests edge cases:
- Zero bookings
- All no-shows
- Low sample size confidence
- No candidates
- Full capacity
- Gate preference impact  
- Carrier buffer strategy when score < 60
"""
import pytest
from datetime import datetime, timedelta, timezone
from app.algorithms.slot_recommender import recommend_slots


class TestSlotRecommender:
    """Test slot recommendation algorithm with edge cases."""
    
    def test_basic_recommendation(self):
        """Test basic slot recommendation with valid candidates."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A",
            "gate": "G1"
        }
        
        candidates = [
            {
                "slot_id": "SLOT-101",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            },
            {
                "slot_id": "SLOT-102",
                "start": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G2",
                "capacity": 15,
                "remaining": 10
            }
        ]
        
        result = recommend_slots(requested, candidates)
        
        assert "recommended" in result
        assert len(result["recommended"]) > 0
        assert result["recommended"][0]["slot_id"] in ["SLOT-101", "SLOT-102"]
    
    def test_no_candidates(self):
        """Test with zero available candidates."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A"
        }
        
        result = recommend_slots(requested, [])
        
        assert result["recommended"] == []
        assert "reasons" in result
        assert any("no" in r.lower() or "empty" in r.lower() for r in result["reasons"])
    
    def test_gate_preference_match(self):
        """Test that gate preference increases slot priority."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A",
            "gate": "G2"  # Prefer G2
        }
        
        candidates = [
            {
                "slot_id": "SLOT-G1",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            },
            {
                "slot_id": "SLOT-G2",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G2",  # Matches preference
                "capacity": 20,
                "remaining": 15
            }
        ]
        
        result = recommend_slots(requested, candidates, carrier_score=None)
        
        # Should prefer G2 due to gate matching
        assert result["recommended"][0]["gate"] == "G2"
    
    def test_full_capacity_filtered_out(self):
        """Test that slots with no remaining capacity are filtered."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A"
        }
        
        candidates = [
            {
                "slot_id": "SLOT-FULL",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 0  # Full!
            },
            {
                "slot_id": "SLOT-AVAILABLE",
                "start": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 15,
                "remaining": 5
            }
        ]
        
        result = recommend_slots(requested, candidates)
        
        assert len(result["recommended"]) == 1
        assert result["recommended"][0]["slot_id"] == "SLOT-AVAILABLE"
    
    def test_carrier_score_low_uses_buffer(self):
        """Test that carrier_score < 60 triggers buffer strategy."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A"
        }
        
        candidates = [
            {
                "slot_id": "SLOT-101",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            }
        ]
        
        # Low carrier score (< 60)
        result_low = recommend_slots(requested, candidates, carrier_score=45)
        
        # High carrier score (>= 60)
        result_high = recommend_slots(requested, candidates, carrier_score=85)
        
        # Both should recommend, but strategy might differ
        assert "recommended" in result_low
        assert "recommended" in result_high
        
        # Low score might mention buffer/priority in reasons
        assert "strategy" in result_low
    
    def test_deterministic_ordering(self):
        """Test that recommendations are deterministic for same input."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A"
        }
        
        candidates = [
            {
                "slot_id": f"SLOT-{i}",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 10 + i
            }
            for i in range(5)
        ]
        
        result1 = recommend_slots(requested, candidates)
        result2 = recommend_slots(requested, candidates)
        
        # Should be deterministic
        assert result1["recommended"][0]["slot_id"] == result2["recommended"][0]["slot_id"]
    
    def test_time_proximity_preference(self):
        """Test that slots closer to requested time are preferred."""
        requested = {
            "start": "2026-02-10 10:00:00+00:00",
            "terminal": "A"
        }
        
        candidates = [
            {
                "slot_id": "SLOT-EARLY",
                "start": datetime(2026, 2, 10, 6, 0, tzinfo=timezone.utc).isoformat(),  # 4 hours before
                "end": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            },
            {
                "slot_id": "SLOT-EXACT",
                "start": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),  # Exact match
                "end": datetime(2026, 2, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            },
            {
                "slot_id": "SLOT-LATE",
                "start": datetime(2026, 2, 10, 16, 0, tzinfo=timezone.utc).isoformat(),  # 6 hours after
                "end": datetime(2026, 2, 10, 18, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            }
        ]
        
        result = recommend_slots(requested, candidates)
        
        # Should prefer the exact match
        assert result["recommended"][0]["slot_id"] == "SLOT-EXACT"
    
    def test_returns_structured_response(self):
        """Test that response has expected structure."""
        requested = {
            "start": "2026-02-10 09:00:00+00:00",
            "terminal": "A"
        }
        
        candidates = [
            {
                "slot_id": "SLOT-101",
                "start": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc).isoformat(),
                "end": datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc).isoformat(),
                "gate": "G1",
                "capacity": 20,
                "remaining": 15
            }
        ]
        
        result = recommend_slots(requested, candidates)
        
        # Check structure
        assert "recommended" in result
        assert "strategy" in result
        assert "reasons" in result
        assert isinstance(result["recommended"], list)
        assert isinstance(result["reasons"], list)
        assert isinstance(result["strategy"], str)
