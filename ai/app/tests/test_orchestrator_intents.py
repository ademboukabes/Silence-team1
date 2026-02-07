"""
Tests for orchestrator intent detection (French and English).
"""
import pytest
from app.orchestrator.orchestrator import Orchestrator


class TestIntentDetection:
    """Test intent detection from user messages in FR/EN."""
    
    def setup_method(self):
        """Set up orchestrator for each test."""
        self.orch = Orchestrator()
    
    # === HELP INTENT ===
    
    def test_help_intent_english(self):
        """Test help intent detection in English."""
        test_messages = [
            "help",
            "I need help",
            "what can you do",
            "how to use this",
            "hello"
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "help", f"Failed for: {msg}"
    
    # === BOOKING STATUS ===
    
    def test_booking_status_english(self):
        """Test booking_status intent in English."""
        test_messages = [
            "What's the status of REF123?",
            "Check my booking BK-456",
            "Track reservation ref789",
            "Where is my booking?",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "booking_status", f"Failed for: {msg}"
    
    def test_booking_status_french(self):
        """Test booking_status intent in French (if pattern supports)."""
        # Note: Current patterns are primarily English
        # This test documents expected future behavior
        intent = self.orch._detect_intent("statut réservation BK-123", [])
        # May be unknown unless we add French patterns - documenting for future
        assert intent in ["booking_status", "unknown"]
    
    # === BOOKING CREATE ===
    
    def test_booking_create_english(self):
        """Test booking_create intent in English."""
        test_messages = [
            "Book terminal A tomorrow",
            "I want to reserve a slot",
            "Create booking for terminal B",
            "Schedule appointment at gate G1",
            "Make a reservation",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "booking_create", f"Failed for: {msg}"
    
    def test_booking_create_french(self):
        """Test booking_create intent in French."""
        test_messages = [
            "réserver un créneau",
            "créer rendez-vous",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "booking_create", f"Failed for: {msg}"
    
    # === SLOT AVAILABILITY ===
    
    def test_slot_availability_english(self):
        """Test slot_availability intent in English."""
        test_messages = [
            "Are there available slots tomorrow?",
            "Check availability at terminal A",
            "Is there free time at gate G1?",
            "Show me open appointments",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "slot_availability", f"Failed for: {msg}"
    
    def test_slot_availability_french(self):
        """Test slot_availability in French (créneaux disponibles)."""
        intent = self.orch._detect_intent("créneaux disponibles terminal A", [])
        # May need French pattern addition - documenting expected behavior
        assert intent in ["slot_availability", "unknown"]
    
    # === PASSAGE HISTORY ===
    
    def test_passage_history_intent(self):
        """Test passage_history intent."""
        test_messages = [
            "Show yesterday's truck entries",
            "passage history for terminal A",
            "list entries from yesterday",
            "vehicle history",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "passage_history", f"Failed for: {msg}"
    
    # === BLOCKCHAIN AUDIT ===
    
    def test_blockchain_audit_intent(self):
        """Test blockchain_audit intent."""
        test_messages = [
            "Verify booking REF123 on blockchain",
            "Prove transaction BK-456",
            "Audit trail for my reservation",
            "blockchain proof",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "blockchain_audit", f"Failed for: {msg}"
    
    # === UNKNOWN ===
    
    def test_unknown_intent(self):
        """Test unknown intent for gibberish."""
        test_messages = [
            "asdfghjkl qwerty",
            "xyzabc nonsense",
            "12345",
        ]
        
        for msg in test_messages:
            intent = self.orch._detect_intent(msg, [])
            assert intent == "unknown", f"Failed for: {msg}"
    
    # === PRIORITY ORDERING ===
    
    def test_booking_create_vs_availability(self):
        """Test that booking_create has higher priority than slot_availability."""
        # Message contains both "book" and "available"
        intent = self.orch._detect_intent("book an available slot", [])
        assert intent == "booking_create"
    
    def test_blockchain_vs_booking_status(self):
        """Test that blockchain_audit takes priority over booking_status."""
        intent = self.orch._detect_intent("verify blockchain proof for REF123", [])
        assert intent == "blockchain_audit"
    
    # === FOLLOW-UP DETECTION ===
    
    def test_follow_up_reuses_last_intent(self):
        """Test that short follow-ups reuse the last intent."""
        history = [
            {"intent": "booking_status", "message": "What's the status of REF123?"}
        ]
        
        # Short message with follow-up keyword
        intent = self.orch._detect_intent("and terminal A?", history)
        assert intent == "booking_status"
    
    def test_follow_up_ignores_unknown_help(self):
        """Test that follow-up doesn't reuse unknown or help intents."""
        history = [
            {"intent": "unknown", "message": "gibberish"},
            {"intent": "booking_status", "message": "status REF123"}
        ]
        
        intent = self.orch._detect_intent("also", history)
        # Should skip "unknown" and find "booking_status"
        assert intent == "booking_status"
