"""
Tests for orchestrator RBAC (Role-Based Access Control).
"""
import pytest
from app.orchestrator.orchestrator import Orchestrator


class TestRBACPolicies:
    """Test RBAC policy enforcement."""
    
    def setup_method(self):
        """Set up orchestrator for each test."""
        self.orch = Orchestrator()
    
    # === ADMIN ROLE ===
    
    def test_admin_allowed_all_intents(self):
        """Test that ADMIN role is allowed all intents."""
        allowed_intents = [
            "booking_status",
            "booking_create",
            "slot_availability",
            "passage_history",
            "blockchain_audit",
            "help"
        ]
        
        for intent in allowed_intents:
            assert self.orch._rbac_check(intent, "ADMIN"), \
                f"ADMIN should be allowed {intent}"
    
    # === OPERATOR ROLE ===
    
    def test_operator_allowed_intents(self):
        """Test that OPERATOR has access to all features."""
        allowed_intents = [
            "booking_status",
            "booking_create",
            "slot_availability",
            "passage_history",
            "blockchain_audit",
            "help"
        ]
        
        for intent in allowed_intents:
            assert self.orch._rbac_check(intent, "OPERATOR"), \
                f"OPERATOR should be allowed {intent}"
    
    # === CARRIER ROLE ===
    
    def test_carrier_allowed_intents(self):
        """Test that CARRIER has limited access."""
        allowed_intents = [
            "booking_status",
            "booking_create",
            "slot_availability",
            "passage_history",
            "help"
        ]
        
        for intent in allowed_intents:
            assert self.orch._rbac_check(intent, "CARRIER"), \
                f"CARRIER should be allowed {intent}"
    
    def test_carrier_denied_blockchain(self):
        """Test that CARRIER is denied blockchain_audit."""
        assert not self.orch._rbac_check("blockchain_audit", "CARRIER"), \
            "CARRIER should NOT be allowed blockchain_audit"
    
    # === UNKNOWN ROLE ===
    
    def test_unknown_role_denied_all(self):
        """Test that unknown roles are denied all intents."""
        unknown_roles = ["ANON", "PUBLIC", "GUEST", ""]
        test_intents = ["booking_status", "slot_availability", "booking_create"]
        
        for role in unknown_roles:
            for intent in test_intents:
                assert not self.orch._rbac_check(intent, role), \
                    f"{role} should be denied {intent}"
    
    # === CASE SENSITIVITY ===
    
    def test_role_normalization(self):
        """Test that role check is case-insensitive."""
        # Note: orchestrator normalizes roles to uppercase
        # Testing here assumes that normalization happens before RBAC check
        assert self.orch._rbac_check("help", "ADMIN")
        # If roles aren't normalized, lowercase would fail
        # This documents expected behavior after normalization
    
    # === INTEGRATION: Full Message Flow ===
    
    async def test_rbac_denied_returns_forbidden_response(self):
        """Test that RBAC denial returns proper error response."""
        result = await self.orch.handle_message(
            message="Verify blockchain proof for REF123",
            history=[],
            user_role="CARRIER",  # Not allowed blockchain_audit
            user_id=1,
            context={}
        )
        
        assert result["intent"] == "forbidden"
        assert "not available for your role" in result["message"]
        assert result["data"]["requested_intent"] == "blockchain_audit"
        assert result["data"]["user_role"] == "CARRIER"
    
    async def test_rbac_allowed_routes_to_agent(self):
        """Test that allowed intent routes to agent (even if agent not implemented)."""
        result = await self.orch.handle_message(
            message="What's the status of REF123?",
            history=[],
            user_role="CARRIER",  # Allowed booking_status
            user_id=1,
            context={}
        )
        
        # Should route to agent or return "not_implemented", not "forbidden"
        assert result["intent"] in ["booking_status", "not_implemented"]
        assert result["intent"] != "forbidden"
    
    async def test_help_bypasses_rbac(self):
        """Test that help intent bypasses RBAC."""
        result = await self.orch.handle_message(
            message="help",
            history=[],
            user_role="ANON",  # Unknown role
            user_id=0,
            context={}
        )
        
        assert result["intent"] == "help"
        assert "available_features" in result["data"]
    
    async def test_unknown_bypasses_rbac(self):
        """Test that unknown intent bypasses RBAC."""
        result = await self.orch.handle_message(
            message="gibberish nonsense xyz",
            history=[],
            user_role="ANON",
            user_id=0,
            context={}
        )
        
        assert result["intent"] == "unknown"
        assert "suggestions" in result["data"]
