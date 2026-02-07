"""
Quick STT Test Script

Minimal script to test STT with a real audio file.
"""

import asyncio
import sys


async def test_with_file(audio_file_path: str):
    """Test STT with an actual audio file."""
    
    # Import STT client
    from app.tools import stt_service_client
    
    # Read audio file
    print(f"Reading audio file: {audio_file_path}")
    with open(audio_file_path, 'rb') as f:
        audio_bytes = f.read()
    
    print(f"Audio size: {len(audio_bytes) / 1024:.2f} KB")
    
    # Transcribe
    print("\nTranscribing... (this may take 5-10 seconds for first run)")
    print("(Model will download on first use: ~1.5GB for medium model)")
    
    result = await stt_service_client.transcribe_bytes(
        audio_bytes=audio_bytes,
        filename=audio_file_path,
        language_hint="ar-dz",  # Algerian Darija
        normalize=False,
        request_id="quick-test"
    )
    
    # Display result
    print("\n" + "=" * 60)
    print("TRANSCRIPTION RESULT")
    print("=" * 60)
    print(f"Text: {result['text']}")
    print(f"Language: {result['language']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Duration: {result['duration_seconds']:.1f}s")
    print(f"Provider: {result['proofs']['provider']}")
    print(f"Model: {result['proofs']['model']}")
    print(f"Processing time: {result['proofs']['processing_time_ms']}ms")
    
    if result.get('normalized_text'):
        print(f"\nNormalized: {result['normalized_text']}")
    
    print("\n✅ Transcription complete!")


async def main():
    if len(sys.argv) < 2:
        print("Usage: python quick_test_stt.py <path_to_audio_file>")
        print("\nExample:")
        print("  python quick_test_stt.py test_audio.mp3")
        print("\nSupported formats: mp3, m4a, ogg, wav, webm, opus")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    try:
        await test_with_file(audio_file)
    except FileNotFoundError:
        print(f"❌ File not found: {audio_file}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
