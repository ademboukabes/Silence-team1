"""
Tests for orchestrator entity extraction logic.

Includes regression test for slot_id hyphen preservation (SLOT-123).
"""
import pytest
from app.orchestrator.orchestrator import Orchestrator


class TestEntityExtraction:
    """Test entity extraction from user messages."""
    
    def setup_method(self):
        """Set up orchestrator for each test."""
        self.orch = Orchestrator()
    
    def test_booking_ref_simple(self):
        """Test extraction of simple booking reference."""
        entities = self.orch._extract_entities("What's the status of REF123?")
        assert "booking_ref" in entities
        assert entities["booking_ref"] == "REF123"
    
    def test_booking_ref_with_hyphen(self):
        """Test extraction of booking reference with hyphen."""
        entities = self.orch._extract_entities("Check REF-456")
        assert "booking_ref" in entities
        assert entities["booking_ref"] == "REF456"
    
    def test_terminal_extraction(self):
        """Test terminal extraction."""
        entities = self.orch._extract_entities("Book terminal A tomorrow")
        assert "terminal" in entities
        assert entities["terminal"] == "A"
    
    def test_gate_extraction(self):
        """Test gate extraction."""
        entities = self.orch._extract_entities("Is gate G5 available?")
        assert "gate" in entities
        assert entities["gate"] == "G5"
    
    def test_slot_id_with_hyphen_preserved(self):
        """REGRESSION: Ensure slot_id preserves hyphens (SLOT-123)."""
        test_cases = [
            ("Book SLOT-123 at terminal A", "SLOT-123"),
            ("I want slot SLOT-456", "SLOT-456"),
            ("Reserve SLOT789", "SLOT789"),  # No hyphen in input, keeps as is
            ("slot-abc-123 please", "SLOT-ABC-123"),  # Multiple hyphens preserved
        ]
        
        for message, expected in test_cases:
            entities = self.orch._extract_entities(message)
            assert "slot_id" in entities, f"No slot_id extracted from: {message}"
            assert entities["slot_id"] == expected, \
                f"Expected '{expected}' but got '{entities['slot_id']}' from: {message}"

    
    def test_carrier_id_numeric(self):
        """Test carrier_id extraction (numeric only)."""
        entities = self.orch._extract_entities("carrier 123 score")
        assert "carrier_id" in entities
        assert entities["carrier_id"] == "123"
    
    def test_date_keywords(self):
        """Test date keyword extraction."""
        test_cases = [
            ("availability today", "date_today"),
            ("book tomorrow", "date_tomorrow"),
            ("show yesterday's entries", "date_yesterday"),
        ]
        
        for message, expected_key in test_cases:
            entities = self.orch._extract_entities(message)
            assert expected_key in entities
            assert entities[expected_key] is True
    
    def test_multiple_entities(self):
        """Test extracting multiple entities from one message."""
        message = "Book SLOT-123 at terminal A gate G1 tomorrow for carrier 456"
        entities = self.orch._extract_entities(message)
        
        assert entities["slot_id"] == "SLOT-123"
        assert entities["terminal"] == "A"
        assert entities["gate"] == "G1"
        assert entities["date_tomorrow"] is True
        assert entities["carrier_id"] == "456"
    
    def test_empty_message(self):
        """Test with empty message returns empty entities."""
        entities = self.orch._extract_entities("")
        assert isinstance(entities, dict)
        assert len(entities) == 0
    
    def test_case_insensitive(self):
        """Test that extraction is case-insensitive."""
        test_cases = [
            ("terminal a", "A"),
            ("TERMINAL B", "B"),
            ("Terminal C", "C"),
        ]
        
        for message, expected in test_cases:
            entities = self.orch._extract_entities(message)
            assert entities.get("terminal") == expected
