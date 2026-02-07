#!/usr/bin/env python3
"""
Setup Script for STT with Correct Python Version

Automatically checks Python version and guides installation.
"""

import sys
import subprocess
import platform


def check_python_version():
    """Check if Python version is compatible with faster-whisper."""
    version = sys.version_info
    major, minor = version.major, version.minor
    
    print("=" * 60)
    print("Python Version Check")
    print("=" * 60)
    print(f"Current Python: {major}.{minor}.{version.micro}")
    print(f"Platform: {platform.system()}")
    
    # Recommended versions: 3.11.x, 3.12.x
    if major == 3 and minor in [11, 12]:
        print(f"✅ Python {major}.{minor} is COMPATIBLE with faster-whisper")
        return True
    elif major == 3 and minor == 10:
        print(f"⚠️  Python {major}.{minor} is COMPATIBLE but not optimal")
        print("   Recommendation: Upgrade to Python 3.11 or 3.12")
        return True
    elif major == 3 and minor >= 13:
        print(f"❌ Python {major}.{minor} is TOO NEW for faster-whisper")
        print("\n   faster-whisper has compatibility issues with Python 3.13+")
        print("   You need to downgrade to Python 3.11 or 3.12")
        return False
    else:
        print(f"❌ Python {major}.{minor} is NOT COMPATIBLE")
        return False


def check_faster_whisper():
    """Check if faster-whisper is installed."""
    print("\n" + "=" * 60)
    print("faster-whisper Installation Check")
    print("=" * 60)
    
    try:
        import faster_whisper
        version = getattr(faster_whisper, '__version__', 'unknown')
        print(f"✅ faster-whisper is installed (version: {version})")
        return True
    except ImportError:
        print("❌ faster-whisper is NOT installed")
        print("\n   To install: pip install faster-whisper")
        return False


def test_import():
    """Test if faster-whisper can be imported without errors."""
    print("\n" + "=" * 60)
    print("Import Test")
    print("=" * 60)
    
    try:
        import faster_whisper
        print("✅ faster-whisper imports successfully")
        return True
    except Exception as e:
        print(f"❌ faster-whisper import failed: {e}")
        return False


def show_installation_guide():
    """Show installation guide for Python downgrade."""
    print("\n" + "=" * 60)
    print("INSTALLATION GUIDE")
    print("=" * 60)
    
    print("\n📥 Option 1: Download Python 3.12")
    print("-" * 60)
    print("1. Visit: https://www.python.org/downloads/")
    print("2. Download: Python 3.12.2 (Windows installer 64-bit)")
    print("3. Install and check 'Add to PATH'")
    print("4. Verify: py -3.12 --version")
    
    print("\n🔧 Option 2: Create Virtual Environment with Python 3.12")
    print("-" * 60)
    print("1. py -3.12 -m venv venv_py312")
    print("2. venv_py312\\Scripts\\activate")
    print("3. pip install -r requirements.txt")
    print("4. python verify_stt.py")
    
    print("\n📚 Full Guide:")
    print("   See: PYTHON_DOWNGRADE_GUIDE.md")
    print()


def run_quick_test():
    """Run a quick test to verify STT works."""
    print("\n" + "=" * 60)
    print("Quick STT Test")
    print("=" * 60)
    
    try:
        # Try to import and test health
        from app.tools import stt_service_client
        import asyncio
        
        async def test():
            health = await stt_service_client.get_health()
            print(f"STT Enabled: {health['enabled']}")
            print(f"Provider: {health['provider']}")
            print(f"Mode: {health['mode']}")
            print(f"Ready: {health['ready']}")
            
            if health['ready']:
                print("\n✅ STT is READY for use!")
                return True
            else:
                print(f"\n❌ STT not ready: {health.get('error', 'Unknown error')}")
                return False
        
        result = asyncio.run(test())
        return result
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def main():
    """Main setup function."""
    print("\n" + "╔" + "═" * 58 + "╗")
    print("║" + " " * 12 + "STT SETUP - PYTHON VERSION CHECK" + " " * 13 + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    # Check Python version
    python_ok = check_python_version()
    
    # Check faster-whisper installation
    whisper_installed = check_faster_whisper()
    
    # Test import
    if python_ok and whisper_installed:
        import_ok = test_import()
    else:
        import_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    print(f"Python Version: {'✅ OK' if python_ok else '❌ INCOMPATIBLE'}")
    print(f"faster-whisper: {'✅ Installed' if whisper_installed else '❌ Not Installed'}")
    print(f"Import Test: {'✅ OK' if import_ok else '❌ Failed'}")
    
    # Recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    
    if python_ok and whisper_installed and import_ok:
        print("\n🎉 All checks passed!")
        print("\nNext steps:")
        print("1. Run: python verify_stt.py")
        print("2. Start service: uvicorn app.main:app --reload")
        print("3. Test API: curl http://localhost:8000/api/stt/health")
        
        # Try quick test
        run_quick_test()
        
    elif not python_ok:
        print("\n⚠️  Python version incompatible!")
        print("\nYou MUST downgrade to Python 3.11 or 3.12 for STT to work.")
        show_installation_guide()
        
    elif not whisper_installed:
        print("\n⚠️  faster-whisper not installed!")
        print("\nInstall it with:")
        print("  pip install faster-whisper")
        
    else:
        print("\n⚠️  Some issues detected.")
        print("\nTry:")
        print("1. Reinstall: pip install --force-reinstall faster-whisper")
        print("2. Check guide: PYTHON_DOWNGRADE_GUIDE.md")
    
    print()


if __name__ == "__main__":
    main()
