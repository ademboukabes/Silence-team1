"""
Test direct httpx connection to backend to diagnose ConnectError
"""
import asyncio
import httpx

async def test_connection():
    print("Testing direct httpx connection to backend...")
    print(f"URL: http://localhost:3000/api/chat/debug/prisma")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:3000/api/chat/debug/prisma")
            print(f"✅ SUCCESS! Status: {response.status_code}")
            print(f"Response: {response.json()}")
    except httpx.ConnectError as e:
        print(f"❌ ConnectError: {e}")
        print(f"Error details: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"❌ Other error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
