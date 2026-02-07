"""
Test direct de l'endpoint chat pour identifier le problème de connexion
"""
import asyncio
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# Import after env loaded
from app.tools.nest_client import create_conversation, add_message

async def test_full_flow():
    print("=" * 60)
    print("TEST COMPLET DU FLUX CHAT")
    print("=" * 60)
    
    try:
        # Test 1: Create conversation
        print("\n[1/2] Création conversation...")
        conv = await create_conversation(
            user_id=None,  # Pas d'utilisateur
            user_role="CARRIER"
        )
        print(f"✅ Conversation créée: {conv.get('id')}")
        conv_id = conv.get('id')
        
        # Test 2: Add message
        print("\n[2/2] Ajout message...")
        await add_message(
            conversation_id=conv_id,
            role="USER",
            content="Test message from direct script",
            intent="test"
        )
        print(f"✅ Message ajouté")
        
        print("\n" + "=" * 60)
        print("✅ TOUS LES TESTS RÉUSSIS!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERREUR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_flow())
