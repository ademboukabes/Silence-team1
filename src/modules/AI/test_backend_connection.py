"""
Test script to diagnose backend connectivity from AI service
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

NEST_BACKEND_URL = os.getenv("NEST_BACKEND_URL", "http://localhost:3000")

async def test_connection():
    print(f"Testing connection to: {NEST_BACKEND_URL}")
    print(f"Full URL: {NEST_BACKEND_URL}/api/chat/conversations")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test 1: Simple GET to /api
            print("\n[Test 1] GET /api")
            response = await client.get(f"{NEST_BACKEND_URL}/api")
            print(f"✅ Status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
            # Test 2: POST to create conversation
            print("\n[Test 2] POST /api/chat/conversations")
            response = await client.post(
                f"{NEST_BACKEND_URL}/api/chat/conversations",
                json={"userRole": "CARRIER"},
                headers={"Content-Type": "application/json"}
            )
            print(f"✅ Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
            print("\n✅ All tests passed! Backend is reachable.")
            
    except httpx.ConnectError as e:
        print(f"\n❌ ConnectError: {e}")
        print(f"Cannot connect to {NEST_BACKEND_URL}")
    except httpx.TimeoutException as e:
        print(f"\n❌ TimeoutException: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
