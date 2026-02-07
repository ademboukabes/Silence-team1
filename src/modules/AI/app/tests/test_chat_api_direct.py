"""
Direct test of chat API to capture exact error
"""
import asyncio
import httpx
import json

async def test_chat_api():
    print("=" * 70)
    print("TESTING CHAT API DIRECTLY")
    print("=" * 70)
    
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "help",
        "user_id": 1,
        "user_role": "CARRIER"
    }
    
    print(f"\nURL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("\nSending POST request...")
            response = await client.post(url, json=payload)
            
            print(f"\n✅ Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"\nResponse Body:")
            
            try:
                data = response.json()
                print(json.dumps(data, indent=2))
                
                if response.status_code == 200 or response.status_code == 201:
                    print(f"\n🎉 SUCCESS!")
                    print(f"Conversation ID: {data.get('conversation_id')}")
                    print(f"Message: {data.get('message', '')[:100]}...")
                else:
                    print(f"\n❌ ERROR {response.status_code}")
                    
            except json.JSONDecodeError:
                print(response.text)
                
    except httpx.HTTPStatusError as e:
        print(f"\n❌ HTTP Status Error: {e.response.status_code}")
        print(f"Response: {e.response.text}")
        
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chat_api())
