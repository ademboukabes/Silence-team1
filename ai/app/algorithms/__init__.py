"""
Algorithms Package

Provides deterministic scoring and recommendation algorithms:
- slot_recommender: Slot recommendation with availability and carrier-based ranking

All algorithms use deterministic calculations (no randomness) and return structured results.
"""

from app.algorithms.slot_recommender import recommend_slots

__all__ = [
    "recommend_slots"
]
