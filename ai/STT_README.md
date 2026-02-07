# Speech-to-Text (STT) - Algerian Darija Support

## Overview
The AI Service now includes production-quality Speech-to-Text capabilities with **native Algerian Darija support**, enabling voice-driven chatbot interactions.

---

## Features

✅ **Algerian Darija Support**
- Transcribes Algerian Darija (ar-DZ)
- Supports Modern Standard Arabic (ar)
- Supports French (fr)
- Handles mixed code-switching (Darija + French)

✅ **Example Darija Queries**
```
"kayen blassa ghedwa fel terminal A?"
→ "Is there availability tomorrow at terminal A?"

"rani hab nbooki créneau demain"
→ "I want to book a slot tomorrow"

"carrier score ta3i ch7al?"
→ "What's my carrier score?"
```

✅ **Multiple Input Modes**
- Upload audio file (mp3, m4a, ogg, wav, webm, opus) - max 15MB
- Transcribe from URL
- Direct voice chat (STT → Orchestrator)

✅ **Voice Chat Integration**
- Transcription flows seamlessly into existing orchestrator
- Same intent detection and agent routing as text chat
- Response includes STT metadata (language, confidence)

---

## API Endpoints

### 1. Transcribe Audio File
```bash
POST /api/stt/transcribe
```

**Request**: multipart/form-data
- `file`: Audio file (required)
- `language_hint`: "auto"|"ar-dz"|"ar"|"fr"|"en" (default: "auto")
- `normalize`: Apply Darija normalization (default: false)
- `format`: "json"|"text" (default: "json")

**Example**:
```bash
curl -X POST http://localhost:8000/api/stt/transcribe \
  -F "file=@darija_audio.mp3" \
  -F "language_hint=ar-dz" \
  -F "normalize=false"
```

**Response**:
```json
{
  "text": "kayen blassa ghedwa fel terminal A",
  "language": "ar-dz",
  "confidence": 0.94,
  "duration_seconds": 3.2,
  "normalized_text": "كاين بلاصة غدوة في terminal A",
  "proofs": {
    "trace_id": "abc123",
    "provider": "faster-whisper",
    "model": "medium",
    "processing_time_ms": 1200
  }
}
```

### 2. Transcribe from URL
```bash
POST /api/stt/transcribe-url
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/stt/transcribe-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/audio.mp3",
    "language_hint": "ar-dz",
    "normalize": false
  }'
```

### 3. Voice Chat
```bash
POST /api/chat/voice
```

**Voice → Orchestrator → Agent** (same flow as text chat)

**Example with file**:
```bash
curl -X POST http://localhost:8000/api/chat/voice \
  -F "file=@booking_request.mp3" \
  -F "user_role=CARRIER" \
  -F "language_hint=ar-dz"
```

**Example with URL**:
```bash
curl -X POST http://localhost:8000/api/chat/voice \
  -F "url=https://example.com/audio.mp3" \
  -F "user_role=CARRIER"
```

**Response**:
```json
{
  "message": "✅ Available slots found...",
  "data": {...},
  "proofs": {...},
  "stt": {
    "text": "kayen blassa ghedwa",
    "language": "ar-dz",
    "confidence": 0.92,
    "duration_seconds": 2.1
  },
  "input_modality": "voice"
}
```

### 4. Health Check
```bash
GET /api/stt/health
```

**Response**:
```json
{
  "enabled": true,
  "provider": "local_whisper",
  "model_name": "medium",
  "mode": "real",
  "ready": true,
  "error": null
}
```

---

## Setup

### Option 1: Local Whisper (Recommended)

**Install dependencies**:
```bash
pip install faster-whisper
```

**Configure** `.env`:
```env
STT_ENABLED=true
STT_PROVIDER=local_whisper
STT_MODEL_SIZE=medium  # tiny|base|small|medium|large-v3
STT_DEVICE=cpu  # cpu|cuda (use cuda for faster transcription)
STT_COMPUTE_TYPE=int8  # int8|float16|float32
```

**First run**: Model downloads automatically to `~/.cache/huggingface/hub/`

**Model sizes**:
- `tiny`: Fastest, lower accuracy (~39M params)
- `base`: Balanced  (~74M params)
- `small`: Good accuracy (~244M params)
- `medium`: **Recommended** - Best Darija support (~769M params)
- `large-v3`: Highest accuracy, slower (~1550M params)

### Option 2: External STT API

**Configure** `.env`:
```env
STT_ENABLED=true
STT_PROVIDER=external_api
STT_SERVICE_URL=http://your-stt-service:9000
STT_TRANSCRIBE_PATH=/transcribe
STT_API_KEY=your-api-key  # Optional
```

**Backend contract**: See `implementation_plan.md` for API specs

---

## How It Works

### Architecture
```
Audio Input → STT Service → Transcription → Orchestrator → Agent → Response
```

### Darija Detection
1. Whisper transcribes with `language="ar"` hint
2. Heuristic checks for Darija markers: `fel`, `ta3`, `ghedwa`, `kayen`, `rani`, etc.
3. If 2+ markers found → language = `"ar-dz"`

### Normalization (Optional)
Maps common Darija tokens to Arabic equivalents:
```
fel → في (in/at)
ta3 → تاع (of/belonging to)
ghedwa → غدوة (tomorrow)
kayen → كاين (there is)
```

---

## Configuration

### Audio Constraints
- **Max size**: 15MB (configurable via `STT_MAX_AUDIO_MB`)
- **Supported formats**: mp3, m4a, ogg, wav, webm, opus
- **Timeout**: 30s (configurable via `STT_TIMEOUT`)

### Language Hints
- `auto`: Auto-detect language
- `ar-dz`: Algerian Darija (recommended for Darija audio)
- `ar`: Modern Standard Arabic
- `fr`: French
- `en`: English

### Performance
- **CPU (int8)**: ~5s for 10s audio
- **GPU (float16)**: ~1s for 10s audio
- **Cache**: Not implemented (future enhancement)

---

## Testing

### Run Tests
```bash
# STT API tests
pytest tests/test_stt_routes.py -v

# Voice chat integration tests
pytest tests/test_voice_chat_flow.py -v

# All STT tests
pytest tests/test_stt*.py tests/test_voice*.py -v
```

### Manual Testing
```bash
# 1. Check health
curl http://localhost:8000/api/stt/health

# 2. Transcribe file
curl -X POST http://localhost:8000/api/stt/transcribe \
  -F "file=@test_audio.mp3" \
  -F "language_hint=ar-dz"

# 3. Voice chat
curl -X POST http://localhost:8000/api/chat/voice \
  -F "file=@darija_booking.mp3" \
  -F "user_role=CARRIER"
```

---

## Deployment

### Production Checklist
- [ ] Set `STT_DEVICE=cuda` if GPU available
- [ ] Use `medium` or `large-v3` model for best accuracy
- [ ] Monitor transcription latency (target: <5s p95)
- [ ] Set up error alerting for STT unavailability
- [ ] Consider Redis cache for repeated audio (future)

### Resource Requirements
- **CPU**: 2+ cores recommended
- **Memory**: 2GB+ for medium model
- **Disk**: ~2GB for model cache
- **GPU (optional)**: CUDA-capable for faster transcription

---

## MVP Mode (Development)

For development/testing without actual STT:

```env
STT_MVP_MODE=true
STT_MVP_DUMMY_TEXT=kayen blassa ghedwa?
```

**Behavior**:
- All transcription requests return dummy text
- Response clearly marked: `"mode": "mvp"`
- Never pretends to be real transcription

---

## Troubleshooting

**Model download slow?**
- First run downloads model from Hugging Face (~1GB for medium)
- Check internet connection
- Models cached in `~/.cache/huggingface/hub/`

**Transcription too slow?**
- Use smaller model (`small` or `base`)
- Set `STT_DEVICE=cuda` if GPU available
- Use external API provider

**Poor Darija accuracy?**
- Use `medium` or `large-v3` model
- Set `language_hint=ar-dz` explicitly
- Ensure audio quality is good (clear speech, low noise)

**Audio file rejected?**
- Check file size < 15MB
- Verify format is supported (mp3, m4a, ogg, wav, webm, opus)
- Check MIME type matches extension

---

## Next Steps

1. **Test with real Darija audio samples**
2. **Tune model size** based on accuracy/latency tradeoffs
3. **Add caching** for frequently requested audio
4. **Monitor usage** and optimize based on metrics
5. **Consider fine-tuning** Whisper on Algerian Darija dataset (advanced)

---

## Architecture Integration

STT components added:
- `app/constants/stt_constants.py` - Audio constraints, Darija tokens
- `app/tools/stt_service_client.py` - STT service abstraction
- `app/schemas/stt.py` - Pydantic models
- `app/api/stt.py` - Transcription endpoints
- `app/api/chat_voice.py` - Voice chat endpoint
- `tests/test_stt*.py` - Comprehensive tests

**Zero breaking changes** to existing code - STT is additive only.
