"""
Direct test of nest_client functions to diagnose connection issue
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# Import after loading env
from app.tools import nest_client

async def test_nest_client():
    print(f"NEST_BACKEND_URL: {nest_client.NEST_BACKEND_URL}")
    print(f"CREATE_CONVERSATION_PATH: {nest_client.NEST_CHAT_CREATE_CONVERSATION_PATH}")
    print(f"Full URL: {nest_client.NEST_BACKEND_URL}{nest_client.NEST_CHAT_CREATE_CONVERSATION_PATH}")
    
    try:
        print("\n[Test] Creating conversation...")
        result = await nest_client.create_conversation(
            user_id=None,  # Test without userId
            user_role="CARRIER"
        )
        print(f"✅ Success! Conversation ID: {result.get('id')}")
        print(f"Full response: {result}")
        
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_nest_client())
