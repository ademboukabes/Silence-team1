# AI Service for Truck Booking Management

FastAPI-based AI service providing intelligent features for port gate management.

**Version**: 1.0.0  
**Status**: Production Ready ✅

---

## 🚀 Features

### 🤖 Multi-Agent Chatbot
- Natural language interface for logistics queries (French/English/Darija)
- Conversation history persistence (SQLite + NestJS backend)
- Role-based access control (ADMIN, OPERATOR, CARRIER/DRIVER)
- Structured responses with blockchain proof
- **Voice-to-Chat** integration with STT (Algerian Darija support)

### 🎯 ML-Powered Predictions
- **Traffic Peak Forecasting**: Predict traffic volumes and peak times
- **Anomaly Detection**: Identify delays and no-shows before they happen
- **Monthly Throughput Forecasting**: 1-month ahead predictions with saturation risk scoring

### 🧠 Smart Algorithms
- **Slot Recommendation**: Optimal time slot suggestions based on multiple criteria
- **Carrier Scoring**: Reliability scoring (0-100, Tiers A-D) with explainable components
- **Operator Behavior Analysis**: Pattern detection and performance insights

### 📊 Advanced Analytics
- **Port Stress Index**: Composite indicator of port operational stress
- **Proactive Alerts**: Operational warnings based on predictions
- **What-If Simulation**: Rule-based scenario analysis
- **Operator Analytics**: BA-grade insights with management scoring (0-100)
- **Capacity Utilization Analysis**: Slot capacity vs throughput analysis

### 🔗 Blockchain Integration
- Read-only blockchain queries for audit trails
- Booking validation events
- Gate entry/exit verification
- Refusal and no-show evidence

### 🎙️ Speech-to-Text (STT)
- **Algerian Darija Support** (ar-dz language hint)
- Local Whisper model integration
- Multi-language support (Arabic, French, English)
- Audio file upload and URL transcription
- Darija normalization

### 🧩 LangChain LLM Orchestration
- **Intelligent Intent Classification**: Google Gemini-powered intent detection
- **Tool Calling**: LLM orchestrates existing agents via structured tool calls
- **Message Polishing**: Natural language responses tailored to user language
- **Automatic Fallback**: Gracefully falls back to deterministic orchestrator if LLM unavailable
- **Debug Mode**: Force deterministic mode with `?llm=false` query parameter

---

## 📁 Project Structure

```
ai_service/
├── README.md                           # This file
├── ARCHITECTURE.md                     # Complete architecture documentation
├── requirements.txt                    # Python dependencies
├── .env.example                        # Environment variables template
├── pytest.ini                          # Pytest configuration
│
└── app/                                # Main source code
    ├── main.py                         # FastAPI entry point
    │
    ├── api/                            # REST API endpoints
    │   ├── chat.py                     # POST /api/chat (chatbot)
    │   ├── chat_voice.py               # POST /api/chat/voice (voice-to-chat)
    │   ├── slots.py                    # Slot availability & recommendations
    │   ├── operator.py                 # Operator analytics endpoints
    │   ├── analytics.py                # Stress index, alerts, what-if
    │   ├── stt.py                      # Speech-to-text endpoints
    │   ├── admin.py                    # Admin endpoints (health, system info)
    │   └── router.py                   # Central router aggregator
    │
    ├── orchestrator/                   # Multi-agent coordination
    │   ├── orchestrator.py             # Main orchestrator (execute)
    │   ├── intent_detector.py          # Intent detection (regex + LLM)
    │   ├── entity_extractor.py         # Entity extraction
    │   └── policy.py                   # RBAC enforcement
    │
    ├── agents/                         # Specialized agents
    │   ├── base_agent.py               # BaseAgent (abstract class)
    │   ├── registry.py                 # Agent registry (singleton pattern)
    │   ├── booking_agent.py            # Booking status queries
    │   ├── booking_create_agent.py     # Booking creation
    │   ├── slot_agent.py               # Slot availability & recommendations
    │   ├── operator_analytics_agent.py # Operator performance analytics
    │   ├── analytics_agent.py          # Stress index, alerts, what-if
    │   └── blockchain_audit_agent.py   # Blockchain audit queries
    │
    ├── algorithms/                     # Deterministic algorithms
    │   ├── carrier_scoring.py          # Carrier reliability scoring
    │   └── slot_recommender.py         # Slot ranking algorithm
    │
    ├── analytics/                      # Advanced analytics modules
    │   ├── operator_behavior_analysis.py    # Operator pattern detection
    │   ├── slot_capacity_analysis.py        # Capacity utilization analysis
    │   ├── monthly_forecast_engine.py       # Monthly throughput forecasting
    │   ├── stress_index.py                  # Port stress index computation
    │   ├── proactive_alerts.py              # Alert generation
    │   └── what_if_simulation.py            # Scenario simulation
    │
    ├── agno_runtime/                   # AGNO LLM integration
    │   ├── intent_classifier.py        # LLM-powered intent classification
    │   ├── message_polisher.py         # Response polishing
    │   ├── operator_analytics_polish.py# Analytics narrative generation
    │   └── llm_provider.py             # Google Gemini integration
    │
    ├── tools/                          # HTTP clients & utilities
    │   ├── nest_client.py              # NestJS backend client
    │   ├── booking_service_client.py   # Booking service client
    │   ├── booking_write_client.py     # Booking write operations
    │   ├── slot_service_client.py      # Slot service client
    │   ├── carrier_service_client.py   # Carrier service client
    │   ├── analytics_data_client.py    # Analytics service client
    │   ├── blockchain_service_client.py# Blockchain client
    │   ├── stt_service_client.py       # STT service client
    │   ├── time_tool.py                # Time utilities
    │   └── blockchain_tool.py          # Blockchain utilities
    │
    ├── schemas/                        # Pydantic models
    │   ├── chat.py                     # Chat request/response schemas
    │   ├── stt.py                      # STT schemas
    │   ├── operator_analytics.py       # Operator analytics schemas
    │   ├── stress.py                   # Stress index schemas
    │   └── base.py                     # Base response schemas
    │
    ├── core/                           # Core utilities
    │   ├── config.py                   # Settings (environment variables)
    │   ├── logging.py                  # Logging setup with trace_id
    │   ├── errors.py                   # Custom exceptions
    │   └── security.py                 # Authentication & RBAC
    │
    ├── constants/                      # Constants
    │   ├── roles.py                    # User roles (ADMIN, OPERATOR, CARRIER)
    │   ├── intents.py                  # Intent constants
    │   ├── stt_constants.py            # STT configuration
    │   └── thresholds.py               # Algorithm thresholds
    │
    └── tests/                          # Test suite
        ├── test_operator_analytics.py  # Operator analytics tests
        ├── test_agent_complete.py      # Agent functionality tests
        ├── test_integration.py         # Integration tests
        └── test_openapi.py             # OpenAPI schema validation
```

---

## 🔌 API Endpoints

See [AI_SERVICE_API_SPEC.md](../Endpoint%20doc/AI_SERVICE_API_SPEC.md) for complete API documentation.

### Core Endpoints
- `GET /` - Root health check
- `GET /health` - Detailed health check

### Chat & Voice
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history/{conversation_id}` - Get conversation history
- `DELETE /api/chat/history/{conversation_id}` - Delete conversation
- `POST /api/chat/voice` - Voice-to-chat (STT + Orchestrator)

### Slot Intelligence
- `GET /api/slots/availability` - Get available slots (public + authenticated)
- `POST /api/slots/recommend` - Get AI-powered slot recommendations (authenticated)

### Operator Analytics (NEW!)
- `GET /api/operator/bookings/{ref}/status` - Get booking status
- `POST /api/operator/bookings/status/batch` - Batch booking status
- `GET /api/operator/slots/availability` - Slot availability (operator view)
- `GET /api/operator/ai-overview` - **AI operator analytics with BA scoring**
- `GET /api/operator/month-forecast` - **Monthly throughput forecast**

### Analytics
- `GET /api/analytics/stress-index` - Compute port stress index
- `GET /api/analytics/alerts` - Generate proactive alerts
- `POST /api/analytics/what-if` - Run what-if scenario simulation
- `GET /api/analytics/health` - Analytics service health

### Speech-to-Text (STT) (NEW!)
- `POST /api/stt/transcribe` - Transcribe uploaded audio file
- `POST /api/stt/transcribe-url` - Transcribe audio from URL
- `GET /api/stt/health` - STT service health

### Admin
- `GET /api/admin/health/models` - Model registry health
- `GET /api/admin/health/services` - Backend services health
- `GET /api/admin/system/info` - System information

---

## 🔐 RBAC Matrix

| Role | Chat | Voice | Slots | Operator | Analytics | STT | Admin |
|------|------|-------|-------|----------|-----------|-----|-------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OPERATOR** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **CARRIER** | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ✅ | ❌ |
| **PUBLIC** | ❌ | ✅ | ✅ (limited) | ❌ | ❌ | ✅ | ❌ |

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
# Core Services
NEST_BASE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
SLOT_SERVICE_URL=http://localhost:3003
CARRIER_SERVICE_URL=http://localhost:3004
ANALYTICS_SERVICE_URL=http://localhost:3005
BLOCKCHAIN_SERVICE_URL=http://localhost:3010

# Booking Write Service
BOOKING_CREATE_PATH=/bookings
BOOKING_RESCHEDULE_PATH=/bookings/{booking_ref}/reschedule
BOOKING_CANCEL_PATH=/bookings/{booking_ref}/cancel
BOOKING_WRITE_CLIENT_TIMEOUT=15.0
BOOKING_WRITE_CLIENT_MAX_CONNECTIONS=100

# Speech-to-Text (STT) - Algerian Darija Support
STT_ENABLED=true
STT_PROVIDER=local_whisper  # local_whisper|external_api
STT_MODEL_SIZE=medium  # tiny|base|small|medium|large-v3
STT_DEVICE=cpu  # cpu|cuda
STT_COMPUTE_TYPE=int8  # int8|float16|float32
STT_MAX_AUDIO_MB=15
STT_TIMEOUT=30.0

# STT External API (if using external_api provider)
# STT_SERVICE_URL=http://localhost:9000
# STT_TRANSCRIBE_PATH=/transcribe
# STT_API_KEY=optional-key

# STT MVP Mode (development only)
# STT_MVP_MODE=false
# STT_MVP_DUMMY_TEXT=kayen blassa ghedwa?

# LangChain LLM Orchestration (Optional but Recommended)
LANGCHAIN_ENABLED=true
GOOGLE_API_KEY=your-google-api-key-here  # Get from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash for faster responses
LLM_TEMPERATURE=0.2
LLM_MAX_OUTPUT_TOKENS=1024
LLM_TIMEOUT_SECONDS=20
TOOL_CALL_MAX_STEPS=4
INTENT_CONFIDENCE_THRESHOLD=0.55
LLM_DEBUG=false

# Other services
BLOCKCHAIN_RPC_URL=http://localhost:8545
MODEL_PATH=./app/models
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite+aiosqlite:///./conversations.db
```

---

## 🚀 Setup & Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run specific test suite
pytest tests/test_operator_analytics.py -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run agent tests
pytest tests/test_agent_complete.py -v

# Format code
black app/

# Lint
flake8 app/
mypy app/
```

---

## 📖 Example Usage

### Voice Chat (Darija)
```bash
curl -X POST http://localhost:8000/api/chat/voice \
  -F "file=@booking_request.mp3" \
  -F "user_role=CARRIER" \
  -F "language_hint=ar-dz"
```

### Operator Analytics
```bash
curl "http://localhost:8000/api/operator/ai-overview?operator_id=OP123&terminal=A&days=30" \
  -H "Authorization: Bearer <token>" \
  -H "x-user-role: OPERATOR"
```

### Monthly Forecast
```bash
curl "http://localhost:8000/api/operator/month-forecast?operator_id=OP123&month=2026-03&capacity_boost_pct=10" \
  -H "Authorization: Bearer <token>" \
  -H "x-user-role: OPERATOR"
```

### Slot Recommendation
```bash
curl -X POST http://localhost:8000/api/slots/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "terminal": "A",
    "date": "2026-02-07",
    "carrier_id": "CAR123",
    "requested_time": "14:00"
  }'
```

### Booking Creation
```bash
# Direct booking with slot_id
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Book slot SLOT-123 at terminal A tomorrow",
    "user_role": "CARRIER"
  }'

# Smart booking without slot_id (auto-recommend)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Book terminal A tomorrow for carrier 456",
    "user_role": "CARRIER"
  }'
```

---

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture documentation.

### Key Design Patterns
- **Multi-Agent Architecture**: Specialized agents for different domains
- **Connection Pooling**: Singleton HTTP clients with graceful shutdown
- **RBAC Enforcement**: Role-based access control at API and agent levels
- **Trace ID Propagation**: Request tracing across all services
- **Graceful Degradation**: Fallback to deterministic mode if LLM unavailable
- **REAL-ONLY Mode**: Analytics modules work with real backend data only

---

## 🔗 Backend Dependencies

The AI Service integrates with the following microservices:

1. **NestJS Backend** (:3001) - Authentication, conversation persistence
2. **Booking Service** (:3002) - Booking CRUD operations
3. **Slot Service** (:3003) - Slot availability and capacity
4. **Carrier Service** (:3004) - Carrier statistics and profiles
5. **Analytics Service** (:3005) - Operational metrics and aggregations
6. **Blockchain Service** (:3010) - Audit trail (read-only)
7. **STT Service** - Local Whisper or external STT provider

---

## 📊 Key Features

### Operator Analytics (NEW!)
- **BA-Grade Insights**: Business Analyst level analytics with management scoring
- **Operator Management Score**: 0-100 score based on decision quality, utilization, patterns
- **Planning Quality**: GOOD/RISK/CRITICAL assessment
- **Behavior Pattern Detection**: Identifies unusual operator behavior
- **Capacity Utilization Analysis**: Slot capacity vs throughput analysis
- **Monthly Forecasting**: 1-month ahead predictions with saturation risk
- **What-If Simulation**: Capacity boost scenarios
- **AGNO Polishing**: LLM-generated executive summaries

### STT (Speech-to-Text)
- **Algerian Darija Support**: Native support for ar-dz language
- **Multi-Language**: Arabic, French, English
- **Local Whisper**: Privacy-focused local processing
- **Normalization**: Optional Darija text normalization
- **Voice-to-Chat**: Seamless integration with chatbot

---

## 📝 Documentation

- [README.md](./README.md) - This file (overview and quick start)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture documentation
- [AI_SERVICE_API_SPEC.md](../Endpoint%20doc/AI_SERVICE_API_SPEC.md) - Complete API specification
- [Swagger UI](http://localhost:8000/docs) - Interactive API documentation
- [ReDoc](http://localhost:8000/redoc) - Alternative API documentation

---

## 🚢 Deployment

### Production Checklist
1. ✅ Configure all backend service URLs
2. ✅ Set up authentication/authorization
3. ✅ Enable CORS for allowed origins
4. ✅ Set `ENVIRONMENT=production`
5. ✅ Set `LOG_LEVEL=INFO`
6. ✅ Verify backend services are reachable
7. ✅ Test RBAC enforcement
8. ✅ Load test critical endpoints
9. ✅ Set up monitoring and alerting
10. ✅ Configure STT service (if using external provider)

---

**Built for Smart Port Truck Booking Management** 🚀  
**Version**: 1.0.0  
**Status**: Production Ready ✅
