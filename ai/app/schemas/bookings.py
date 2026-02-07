"""
Booking Schemas

Pydantic schemas for booking operations (create, update, query).
Provides request validation and response formatting.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingCreateInput(BaseModel):
    """
    Input schema for booking creation.
    Used for API request validation.
    """
    terminal: str = Field(description="Terminal identifier (e.g., 'A', 'B', 'C')")
    date: str = Field(description="Date in YYYY-MM-DD format")
    gate: Optional[str] = Field(None, description="Gate identifier (e.g., 'G1', 'G2')")
    slot_id: Optional[str] = Field(None, description="Specific slot ID (e.g., 'SLOT-123')")
    carrier_id: Optional[int] = Field(None, description="Carrier ID for scoring")
    truck_id: Optional[str] = Field(None, description="Truck identifier")
    driver_id: Optional[str] = Field(None, description="Driver identifier")
    cargo_type: Optional[str] = Field(None, description="Type of cargo")
    requested_time: Optional[str] = Field(None, description="Preferred time (HH:MM or ISO format)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "terminal": "A",
                "date": "2026-02-08",
                "gate": "G2",
                "slot_id": "SLOT-123",
                "carrier_id": 456,
                "truck_id": "TRK-789",
                "cargo_type": "containers"
            }
        }


class BookingCreateOutput(BaseModel):
    """
    Output schema for booking creation.
    Normalized booking response.
    """
    booking_ref: str = Field(description="Unique booking reference")
    status: str = Field(description="Booking status (pending, confirmed, etc.)")
    terminal: str = Field(description="Terminal identifier")
    gate: str = Field(description="Gate identifier")
    slot_id: str = Field(description="Slot ID")
    slot_time: str = Field(description="Scheduled time")
    last_update: str = Field(description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "booking_ref": "REF12345",
                "status": "confirmed",
                "terminal": "A",
                "gate": "G2",
                "slot_id": "SLOT-123",
                "slot_time": "2026-02-08 09:00:00",
                "last_update": "2026-02-06 04:45:00"
            }
        }


class BookingCreateEntityExtract(BaseModel):
    """
    Entities extracted for booking creation from natural language.
    Used internally by orchestrator/agent.
    """
    terminal: Optional[str] = Field(None, description="Extracted terminal identifier")
    date_today: Optional[bool] = Field(None, description="User mentioned 'today'")
    date_tomorrow: Optional[bool] = Field(None, description="User mentioned 'tomorrow'")
    date_yesterday: Optional[bool] = Field(None, description="User mentioned 'yesterday'")
    date_explicit: Optional[str] = Field(None, description="Explicit date in YYYY-MM-DD format")
    gate: Optional[str] = Field(None, description="Extracted gate identifier")
    slot_id: Optional[str] = Field(None, description="Extracted slot ID")
    carrier_id: Optional[int] = Field(None, description="Extracted carrier ID")
    truck_id: Optional[str] = Field(None, description="Extracted truck ID")
    driver_id: Optional[str] = Field(None, description="Extracted driver ID")
    cargo_type: Optional[str] = Field(None, description="Extracted cargo type")


class BookingRescheduleInput(BaseModel):
    """
    Input schema for booking rescheduling.
    """
    slot_id: str = Field(description="New slot ID")
    date: Optional[str] = Field(None, description="New date if different (YYYY-MM-DD)")
    reason: Optional[str] = Field(None, description="Reason for rescheduling")
    
    class Config:
        json_schema_extra = {
            "example": {
                "slot_id": "SLOT-456",
                "date": "2026-02-09",
                "reason": "Truck delay"
            }
        }


class BookingCancelInput(BaseModel):
    """
    Input schema for booking cancellation.
    """
    reason: Optional[str] = Field(None, description="Reason for cancellation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reason": "Weather conditions"
            }
        }


class BookingStatusQuery(BaseModel):
    """
    Input schema for booking status query.
    """
    booking_ref: str = Field(description="Booking reference to query")
    
    class Config:
        json_schema_extra = {
            "example": {
                "booking_ref": "REF12345"
            }
        }
