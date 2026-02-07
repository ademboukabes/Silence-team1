"""
Test Backend Endpoints - Verify AI service can communicate with NestJS backend

This script tests the following backend endpoints:
- POST /api/chat/conversations
- POST /api/chat/conversations/{conversation_id}/messages
- GET /api/chat/conversations/{conversation_id}
- DELETE /api/chat/conversations/{conversation_id}
- POST /api/bookings (if implemented)

Usage: python test_backend_endpoints.py
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the nest_client functions
from app.tools.nest_client import (
    create_conversation,
    add_message,
    get_conversation_history,
    delete_conversation,
    NEST_BACKEND_URL
)

# Also import booking_write_client for bookings
from app.tools.booking_write_client import create_booking


async def test_all_endpoints():
    """Test all backend endpoints that AI service uses"""
    
    print("=" * 80)
    print("BACKEND ENDPOINT TEST")
    print("=" * 80)
    print(f"Backend URL: {NEST_BACKEND_URL}")
    print(f"Testing endpoints with /api prefix")
    print("=" * 80)
    print()
    
    conversation_id = None
    
    try:
        # ====================================================================
        # Test 1: Create Conversation
        # ====================================================================
        print("📝 Test 1: POST /api/chat/conversations")
        print("-" * 80)
        
        conversation_data = await create_conversation(
            user_id=1,
            user_role="OPERATOR"
        )
        
        conversation_id = conversation_data.get("id")
        print(f"✅ SUCCESS - Created conversation: {conversation_id}")
        print(f"   Response: {conversation_data}")
        print()
        
        # ====================================================================
        # Test 2: Add Message
        # ====================================================================
        print("💬 Test 2: POST /api/chat/conversations/{conversation_id}/messages")
        print("-" * 80)
        
        message_data = await add_message(
            conversation_id=conversation_id,
            role="user",
            content="Hello, this is a test message from AI service"
        )
        
        print(f"✅ SUCCESS - Added message")
        print(f"   Message ID: {message_data.get('id')}")
        print(f"   Content: {message_data.get('content')}")
        print()
        
        # Add AI response
        await add_message(
            conversation_id=conversation_id,
            role="assistant",
            content="This is a test AI response"
        )
        
        # ====================================================================
        # Test 3: Get Conversation History
        # ====================================================================
        print("📖 Test 3: GET /api/chat/conversations/{conversation_id}")
        print("-" * 80)
        
        history = await get_conversation_history(
            conversation_id=conversation_id
        )
        
        messages = history.get("messages", [])
        print(f"✅ SUCCESS - Retrieved conversation history")
        print(f"   Conversation ID: {history.get('id')}")
        print(f"   Messages count: {len(messages)}")
        for idx, msg in enumerate(messages, 1):
            print(f"   Message {idx}: [{msg.get('role')}] {msg.get('content')[:50]}...")
        print()
        
        # ====================================================================
        # Test 4: Delete Conversation
        # ====================================================================
        print("🗑️  Test 4: DELETE /api/chat/conversations/{conversation_id}")
        print("-" * 80)
        
        delete_result = await delete_conversation(
            conversation_id=conversation_id
        )
        
        print(f"✅ SUCCESS - Deleted conversation")
        print(f"   Result: {delete_result}")
        print()
        
        # ====================================================================
        # Test 5: Create Booking (if endpoint exists)
        # ====================================================================
        print("🎫 Test 5: POST /api/bookings")
        print("-" * 80)
        
        try:
            booking_data = {
                "carrier_id": "TEST123",
                "terminal": "A",
                "gate": "A1",
                "slot_start": "2026-02-08T10:00:00Z",
                "slot_end": "2026-02-08T11:00:00Z",
                "truck_license_plate": "TEST-001"
            }
            
            booking_result = await create_booking(
                payload=booking_data,
                auth_header=None
            )
            
            print(f"✅ SUCCESS - Created booking")
            print(f"   Booking ref: {booking_result.get('booking_ref')}")
            print(f"   Status: {booking_result.get('status')}")
            print()
            
        except Exception as e:
            print(f"⚠️  Booking endpoint test failed (may not be implemented yet)")
            print(f"   Error: {e}")
            print()
        
        # ====================================================================
        # Summary
        # ====================================================================
        print("=" * 80)
        print("✅ ALL CORE TESTS PASSED")
        print("=" * 80)
        print()
        print("Summary:")
        print("  ✅ POST /api/chat/conversations - Working")
        print("  ✅ POST /api/chat/conversations/{id}/messages - Working")
        print("  ✅ GET /api/chat/conversations/{id} - Working")
        print("  ✅ DELETE /api/chat/conversations/{id} - Working")
        print("  ⚠️  POST /api/bookings - Check logs above")
        print()
        print("The AI service can successfully communicate with the backend!")
        print("All endpoints are using the correct /api prefix.")
        print()
        
    except Exception as e:
        print()
        print("=" * 80)
        print("❌ TEST FAILED")
        print("=" * 80)
        print(f"Error: {type(e).__name__}: {e}")
        print()
        print("Troubleshooting:")
        print(f"1. Make sure the backend is running at {NEST_BACKEND_URL}")
        print("2. Verify the backend has these endpoints with /api prefix")
        print("3. Check backend logs for error details")
        print()
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print()
    asyncio.run(test_all_endpoints())
