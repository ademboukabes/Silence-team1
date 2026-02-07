"""
Shared test fixtures and configuration for AI Service tests.
"""
import pytest
from typing import Dict
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient


@pytest.fixture
def app():
    """FastAPI application fixture."""
    from app.main import app
    return app


@pytest.fixture
def client(app):
    """Synchronous test client for FastAPI."""
    return TestClient(app)


@pytest.fixture
async def async_client(app):
    """Async HTTP client for testing async endpoints."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def admin_headers() -> Dict[str, str]:
    """Headers for ADMIN role."""
    return {
        "Authorization": "Bearer test-admin-token",
        "X-User-Role": "ADMIN",
        "X-User-Id": "1"
    }


@pytest.fixture
def operator_headers() -> Dict[str, str]:
    """Headers for OPERATOR role."""
    return {
        "Authorization": "Bearer test-operator-token",
        "X-User-Role": "OPERATOR",
        "X-User-Id": "2"
    }


@pytest.fixture
def carrier_headers() -> Dict[str, str]:
    """Headers for CARRIER role."""
    return {
        "Authorization": "Bearer test-carrier-token",
        "X-User-Role": "CARRIER",
        "X-User-Id": "3",
        "X-Carrier-Id": "123"
    }


@pytest.fixture
def anon_headers() -> Dict[str, str]:
    """Headers for anonymous/unauthenticated user."""
    return {}


@pytest.fixture
def mock_slot_service(monkeypatch):
    """Mock slot service client for testing."""
    async def mock_get_availability(terminal, date=None, gate=None, auth_header=None, request_id=None):
        return [
            {
                "slot_id": "SLOT-101",
                "terminal": terminal,
                "gate": gate or "G1",
                "start": f"{date}T08:00:00Z" if date else "2026-02-10T08:00:00Z",
                "end": f"{date}T10:00:00Z" if date else "2026-02-10T10:00:00Z",
                "capacity": 20,
                "remaining": 15,
                "status": "available"
            },
            {
                "slot_id": "SLOT-102",
                "terminal": terminal,
                "gate": gate or "G2",
                "start": f"{date}T10:00:00Z" if date else "2026-02-10T10:00:00Z",
                "end": f"{date}T12:00:00Z" if date else "2026-02-10T12:00:00Z",
                "capacity": 15,
                "remaining": 10,
                "status": "available"
            }
        ]
    
    from app.tools import slot_service_client
    monkeypatch.setattr(slot_service_client, "get_availability", mock_get_availability)
    return mock_get_availability


@pytest.fixture
def mock_booking_service(monkeypatch):
    """Mock booking service client for testing."""
    async def mock_get_booking_status(booking_ref, auth_header=None, request_id=None):
        return {
            "booking_ref": booking_ref,
            "status": "confirmed",
            "carrier_id": "123",
            "terminal": "A",
            "gate": "G1",
            "slot_id": "SLOT-101",
            "slot_start": "2026-02-10T08:00:00Z",
            "slot_end": "2026-02-10T10:00:00Z",
            "created_at": "2026-02-09T10:00:00Z",
            "updated_at": "2026-02-09T10:00:00Z"
        }
    
    from app.tools import booking_service_client
    monkeypatch.setattr(booking_service_client, "get_booking_status", mock_get_booking_status)
    return mock_get_booking_status


@pytest.fixture
def mock_booking_write_service(monkeypatch):
    """Mock booking write service for booking creation."""
    async def mock_create_booking(payload, auth_header=None, request_id=None):
        return {
            "booking_ref": "BK-999",
            "status": "pending",
            "terminal": payload.get("terminal"),
            "gate": payload.get("gate", "G1"),
            "slot_id": payload.get("slot_id"),
            "slot_time": "2026-02-10T08:00:00Z - 2026-02-10T10:00:00Z",
            "last_update": "2026-02-09T10:00:00Z"
        }
    
    from app.tools import booking_write_client
    monkeypatch.setattr(booking_write_client, "create_booking", mock_create_booking)
    return mock_create_booking
