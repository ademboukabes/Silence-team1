"""
Test Authorization Requirements - Verify backend properly enforces auth

This script tests whether the backend enforces authorization requirements.
Expected behavior: Requests WITHOUT auth headers should return 401 Unauthorized.

If this test shows that unauthorized requests succeed, it means:
1. Backend has authorization disabled (development mode), OR
2. Backend has a security issue and needs to enforce auth

Usage: python test_authorization.py
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

NEST_BACKEND_URL = os.getenv("NEST_BACKEND_URL", "http://localhost:3000")


async def test_authorization_enforcement():
    """Test if backend properly rejects requests without authorization"""
    
    print("=" * 80)
    print("AUTHORIZATION ENFORCEMENT TEST")
    print("=" * 80)
    print(f"Backend URL: {NEST_BACKEND_URL}")
    print()
    print("Testing if backend requires Authorization header...")
    print("Expected: 401 Unauthorized for requests without auth")
    print("=" * 80)
    print()
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        
        # Test 1: Create conversation WITHOUT authorization
        print("🔒 Test 1: POST /api/chat/conversations (NO AUTH)")
        print("-" * 80)
        
        try:
            response = await client.post(
                f"{NEST_BACKEND_URL}/api/chat/conversations",
                json={"userRole": "OPERATOR"},
                headers={"Content-Type": "application/json"}
                # NOTE: No Authorization header!
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ CORRECT - Backend rejected unauthorized request (401)")
                print("   Authorization is properly enforced!")
            elif response.status_code == 200 or response.status_code == 201:
                print("⚠️  WARNING - Backend ACCEPTED request without authorization!")
                print("   This is likely because:")
                print("   1. Authorization is disabled in development mode, OR")
                print("   2. Backend has a security misconfiguration")
                print()
                print(f"   Response: {response.json()}")
            else:
                print(f"❓ Unexpected status code: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {e}")
        
        print()
        
        # Test 2: Create conversation WITH a fake/invalid authorization
        print("🔒 Test 2: POST /api/chat/conversations (INVALID AUTH)")
        print("-" * 80)
        
        try:
            response = await client.post(
                f"{NEST_BACKEND_URL}/api/chat/conversations",
                json={"userRole": "OPERATOR"},
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer fake-invalid-token-12345"
                }
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401 or response.status_code == 403:
                print("✅ CORRECT - Backend rejected invalid token")
                print("   Authorization validation is working!")
            elif response.status_code == 200 or response.status_code == 201:
                print("⚠️  WARNING - Backend ACCEPTED invalid token!")
                print("   Authorization validation may not be working")
                print()
                print(f"   Response: {response.json()}")
            else:
                print(f"❓ Unexpected status code: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {e}")
        
        print()
        
        # Test 3: Get conversation WITHOUT authorization
        print("🔒 Test 3: GET /api/chat/conversations/{id} (NO AUTH)")
        print("-" * 80)
        
        try:
            # Use a fake conversation ID
            response = await client.get(
                f"{NEST_BACKEND_URL}/api/chat/conversations/test-conv-123",
                headers={"Accept": "application/json"}
                # NOTE: No Authorization header!
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ CORRECT - Backend rejected unauthorized request (401)")
            elif response.status_code == 404:
                print("⚠️  Backend allowed request (returned 404 - not found)")
                print("   This means auth check happened AFTER resource lookup")
                print("   (Or auth is disabled)")
            elif response.status_code == 200:
                print("⚠️  WARNING - Backend ACCEPTED request without authorization!")
                print(f"   Response: {response.json()}")
            else:
                print(f"Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {e}")
        
        print()
        
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    print("The test results above show whether your backend is enforcing authorization.")
    print()
    print("✅ If you see 401/403 responses: Authorization is properly enforced")
    print("⚠️  If you see 200/201 responses: Authorization is NOT being enforced")
    print()
    print("RECOMMENDATION:")
    print("If authorization is not enforced, you should:")
    print("1. Check backend configuration (is auth disabled for development?)")
    print("2. Verify JWT/token validation middleware is active")
    print("3. Add authorization enforcement before deploying to production")
    print()


if __name__ == "__main__":
    asyncio.run(test_authorization_enforcement())
