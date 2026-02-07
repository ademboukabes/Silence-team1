# Architecture du Service IA - Smart Port

> **Guide d'Implémentation Complet pour l'Équipe**

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Flux de Traitement](#flux-de-traitement)
4. [Composants Principaux](#composants-principaux)
5. [Endpoints API](#endpoints-api)
6. [Guide d'Extension](#guide-dextension)
7. [Configuration & Déploiement](#configuration--déploiement)

---

## 🎯 Vue d'Ensemble

Le **Service IA** est un microservice FastAPI Python qui fournit des capacités d'intelligence artificielle pour le Smart Port :

### Fonctionnalités Principales

- **Recommandation de Créneaux** : Suggère les meilleurs slots selon disponibilité et carrier
- **Analytics Opérateur** : Analyse comportementale avec scoring BA (0-100)
- **Prévisions Mensuelles** : Forecast 1 mois avec analyse de saturation (Statistical / EWMA)
- **Analytics Avancés** : Stress index, alertes proactives, simulations what-if
- **Blockchain Audit** : Traçabilité et intégrité des données
- **Chatbot Conversationnel** : Interface NLP multilingue (FR/EN/Darija)
- **Voice-to-Chat** : Intégration STT avec support Darija algérien

### Technologies

- **Framework** : FastAPI (Python 3.9+)
- **HTTP Client** : httpx (async avec connection pooling)
- **Validation** : Pydantic V2
- **Logging** : Standard library avec trace_id propagation
- **LLM** : Google Gemini via **AGNO** pour orchestration intelligente
- **STT** : Whisper (local) pour transcription audio
- **Analytics** : Algorithmes statistiques (EWMA, Naive Bayes, Heuristics)

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│              (Dashboard Frontend / External API)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (FastAPI)                           │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │ /chat    │ /operator│  /slots  │/analytics│   /stt       │  │
│  │ /voice   │ /admin   │/recommend│ /stress  │ /transcribe  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
│         ▲ Authentication & RBAC (x-user-role, Authorization)    │
└─────────┴───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│               ORCHESTRATOR (Chat & Voice Mode)                   │
│  ┌───────────────────────┐                                      │
│  │     AGNO RUNTIME      │                                      │
│  │  (Intent Classifier)  │                                      │
│  └───────────┬───────────┘                                      │
│              │ (Fallback)                                       │
│              ▼                                                  │
│  ┌───────────────────────┐    ┌──────────────────┐              │
│  │  Deterministic Logic  │ -> │ Entity Extractor │              │
│  │   (Regex Strategy)    │    │ (Regex Pattern)  │              │
│  └───────────────────────┘    └────────┬─────────┘              │
│                                        │                        │
│                                        ▼                        │
│                             ┌──────────────────┐                │
│                             │ Policy Enforcer  │                │
│                             │   (RBAC Check)   │                │
│                             └──────────┬───────┘                │
│                                        ▼                        │
│                               ┌──────────────┐                  │
│                               │ Agent Router │                  │
│                               └───────┬──────┘                  │
└───────────────────────────────────────┼─────────────────────────┘
                                        │
          ┌───────────────┴─────────────┴───────────┬─────────────────┐
          ▼                                         ▼                 ▼
┌──────────────────┐                      ┌──────────────────┐   ┌──────────────┐
│  AGENTS          │                      │  ANALYTICS       │   │ AGNO RUNTIME │
│                  │                      │  (Statistical)   │   │  (Response)  │
│ • BookingAgent   │─────────────────────▶│ • operator_      │   │              │
│ • BookingCreate  │                      │   behavior       │   │ • Message    │
│ • SlotAgent      │─────────────────────▶│ • slot_capacity  │   │   Polisher   │
│ • OperatorAnalyt │                      │ • monthly_       │   │ • Operator   │
│ • AnalyticsAgent │                      │   forecast       │   │   Polish     │
│ • BlockchainAudit│                      │ • stress_index   │   │              │
│                  │                      │ • proactive_     │   └──────────────┘
└──────────────────┘                      │   alerts         │          │
          │                               │ • what_if_sim    │          │
          │                               └──────────────────┘          │
          │                                        ▲                    │
          │                                        │                    │
          └────────────────────────────────────────┴────────────────────┘
                                     │
                                     ▼
          ┌──────────────────────────────────────────────────┐
          │          BACKEND SERVICES (External)             │
          │  • NestJS Backend (:3001)                        │
          │  • Booking Service (:3002)                       │
          │  • Slot Service (:3003)                          │
          │  • Carrier Service (:3004)                       │
          │  • Analytics Service (:3005)                     │
          │  • Blockchain Service (:3010)                    │
          │  • STT Service (local Whisper)                   │
          └──────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Traitement

### Mode 1 : Chatbot Conversationnel (avec AGNO)

```
1. Client → POST /api/chat
   Body: { message: "Show operator OP123 analytics", user_role: "OPERATOR" }

2. API Router → Orchestrator.execute()

3. AGNO Intent Classifier (LLM)
   ├─ Appel Google Gemini avec context (via AGNO)
   ├─ Analyse sémantique du message
   └─ Résultat: "operator_analytics" (confidence: 0.95)

4. Entity Extractor
   ├─ Extrait les entités (operator_id: "OP123")
   └─ Résultat: { operator_id: "OP123" }

5. Policy Enforcer
   ├─ Vérifie RBAC (OPERATOR peut voir operator_analytics)
   └─ ✓ Autorisé

6. Agent Router
   ├─ Routing intent → agent
   └─ Sélection: OperatorAnalyticsAgent

7. OperatorAnalyticsAgent.execute()
   ├─ HTTP GET /analytics/operators/OP123/actions
   ├─ HTTP GET /analytics/plan/slots
   ├─ HTTP GET /analytics/ops/throughput
   ├─ Appel analytics: analyze_operator_behavior()
   ├─ Appel analytics: analyze_slot_capacity()
   └─ Résultat: { score: 85, planning_quality: "GOOD", patterns: [...] }

8. AGNO Operator Polish (LLM Response)
   ├─ Génère executive summary
   ├─ Génère key findings
   └─ Enrichit la réponse

9. Response Formatter
   └─ Format: { message: "...", data: {...}, proofs: {...} }

10. Client ← Réponse JSON structurée
```

### Mode 2 : Voice-to-Chat

```
1. Client → POST /api/chat/voice
   Form: { file: audio.mp3, language_hint: "ar-dz", user_role: "CARRIER" }

2. STT Service
   ├─ Whisper transcription (local)
   ├─ Language detection
   ├─ Optional Darija normalization
   └─ Résultat: { text: "kayen blassa ghedwa?", language: "ar-dz", confidence: 0.92 }

3. Orchestrator (same as Mode 1)
   └─ Process transcribed text

4. Client ← { message: "...", data: {...}, stt: {...} }
```

### Mode 3 : API REST Directe

```
1. Dashboard → GET /api/operator/ai-overview?operator_id=OP123&days=30
   Headers: { Authorization, x-user-role: OPERATOR }

2. API Endpoint (operator.py)
   ├─ require_operator_or_admin() → ✓
   └─ Direct call to OperatorAnalyticsAgent

3. OperatorAnalyticsAgent.execute()
   ├─ Fetch data from Analytics Service
   ├─ Run behavior analysis
   ├─ Run capacity analysis
   ├─ Calculate BA score
   └─ Optional: AGNO polish (if enabled)

4. Dashboard ← Réponse JSON directe
```

---

## 🧩 Composants Principaux

### 1. **API Layer** (`app/api/`)

Expose les endpoints REST. Chaque module gère un domaine spécifique.

#### Structure Actuelle

```
app/api/
├── __init__.py
├── router.py           # Agrégateur central de tous les routers
├── chat.py             # POST /api/chat (chatbot)
├── chat_voice.py       # POST /api/chat/voice (voice-to-chat)
├── slots.py            # GET /availability, POST /recommend
├── operator.py         # Operator analytics endpoints
├── analytics.py        # Stress index, alerts, what-if
├── stt.py              # Speech-to-text endpoints
├── admin.py            # Admin endpoints (health, system info)
└── (9 files total)
```

#### Endpoints Clés

**Chat & Voice**
- `POST /api/chat` - Chatbot conversationnel
- `GET /api/chat/history/{id}` - Historique conversation
- `DELETE /api/chat/history/{id}` - Supprimer conversation
- `POST /api/chat/voice` - Voice-to-chat (STT + Orchestrator)

**Operator Analytics**
- `GET /api/operator/bookings/{ref}/status` - Statut réservation
- `POST /api/operator/bookings/status/batch` - Batch status
- `GET /api/operator/slots/availability` - Disponibilité slots
- `GET /api/operator/ai-overview` - **Analytics opérateur avec BA scoring**
- `GET /api/operator/month-forecast` - **Prévisions mensuelles**

**Slot Intelligence**
- `GET /api/slots/availability` - Disponibilité slots (public + auth)
- `POST /api/slots/recommend` - Recommandations IA

**Analytics**
- `GET /api/analytics/stress-index` - Index de stress portuaire
- `GET /api/analytics/alerts` - Alertes proactives
- `POST /api/analytics/what-if` - Simulations scénarios
- `GET /api/analytics/health` - Santé service analytics

**STT (Speech-to-Text)**
- `POST /api/stt/transcribe` - Transcription fichier audio
- `POST /api/stt/transcribe-url` - Transcription depuis URL
- `GET /api/stt/health` - Santé service STT

**Admin**
- `GET /api/admin/health/models` - Santé modèles
- `GET /api/admin/health/services` - Santé services backend
- `GET /api/admin/system/info` - Informations système

---

### 2. **Orchestrator** (`app/orchestrator/`)

Gère le flux conversationnel (chatbot uniquement).

#### Composants

```
app/orchestrator/
├── __init__.py
├── orchestrator.py      # execute() - Point d'entrée principal (Hybrid: AGNO + Fallback)
├── intent_detector.py   # Fallback deterministic intent detection
├── entity_extractor.py  # extract_entities(message, intent) → dict
├── policy.py            # enforce_policy(intent, role, entities)
├── response_formatter.py# format_response(agent_result, context)
└── (6 files total)
```

#### Intent Detection (Hybrid: AGNO + Regex)

**Mode AGNO (LLM)** (si `AGNO_ENABLED=true`) :
- Appel Google Gemini via `agno_runtime.intent_classifier`
- Analyse sémantique du message
- Confidence scoring (threshold: 0.45)
- Fallback automatique vers regex si confidence < threshold

**Mode Regex** (fallback ou `llm=false`) :
- Patterns regex multilingues (FR/EN/Darija)
- Extraction d'entités via groupes nommés
- Déterministe et rapide

**Intents Supportés** :
```python
INTENTS = [
    "booking_status",
    "booking_create",
    "booking_cancel",
    "booking_reschedule",
    "slot_availability",
    "slot_recommendation",
    "carrier_score",
    "operator_analytics",      
    "monthly_forecast",        
    "stress_index",
    "proactive_alerts",
    "what_if_simulation",
    "blockchain_audit",
    "general_question"
]
```

---

### 3. **Agents** (`app/agents/`)

Agents spécialisés pour chaque domaine métier.

#### Structure Actuelle

```
app/agents/
├── __init__.py
├── base_agent.py               # BaseAgent (classe abstraite)
├── registry.py                 # Mapping intent → agent (singleton)
├── booking_agent.py            # Statut réservation
├── booking_create_agent.py     # Création réservation
├── slot_agent.py               # Disponibilité/Recommandation slots
├── operator_analytics_agent.py # Analytics opérateur
├── analytics_agent.py          # Stress index, alerts, what-if
├── blockchain_audit_agent.py   # Audit blockchain
└── (9 files total)
```

#### Nouveaux Agents

**OperatorAnalyticsAgent**
- **Responsabilité** : Analyse comportementale des opérateurs
- **Méthodes** :
  - `execute()` - Point d'entrée principal
  - `_calculate_ba_score()` - Calcul score BA (0-100)
  - `_determine_planning_quality()` - GOOD/RISK/CRITICAL
- **Dépendances** :
  - `operator_behavior_analysis.analyze_operator_behavior()` (Heuristic)
  - `slot_capacity_analysis.analyze_slot_capacity()` (Statistical)
  - `agno_runtime.operator_analytics_polish()` (optional LLM)
- **Outputs** :
  - Operator Management Score (0-100)
  - Planning Quality (GOOD/RISK/CRITICAL)
  - Behavior Patterns (list)
  - Suggestions (list)
  - Decision Stats
  - Capacity Utilization

**BookingCreateAgent**
- **Responsabilité** : Création de réservations
- **Méthodes** :
  - `execute()` - Création avec/sans slot_id
  - `_create_with_slot_id()` - Création directe
  - `_create_with_recommendation()` - Auto-recommandation
- **Dépendances** :
  - `booking_write_client.create_booking()`
  - `slot_recommender.recommend_slots()`
  - `carrier_scoring.score_carrier()`

---

### 4. **Analytics** (`app/analytics/`)

Modules d'analytics avancés (REAL-ONLY mode, Statistical focus).

#### Structure Actuelle

```
app/analytics/
├── __init__.py
├── operator_behavior_analysis.py    # Analyse comportementale (Heuristics)
├── slot_capacity_analysis.py        # Analyse capacité (Statistical)
├── monthly_forecast_engine.py       # Prévisions mensuelles (EWMA/TS)
├── stress_index.py                  # Index de stress portuaire
├── proactive_alerts.py              # Génération alertes
├── what_if_simulation.py            # Simulations scénarios
└── (7 files total)
```

#### Modules Clés

**operator_behavior_analysis.py**
- **Fonction** : `analyze_operator_behavior(actions, config)`
- **Analyse** :
  - Patterns de décision (accept/reject ratios)
  - Anomalies temporelles (weekends, nuits)
  - Concentration de décisions (bursts)
  - Qualité de planification
- **Output** :
  - Patterns détectés (title, evidence, severity)
  - Suggestions d'amélioration
  - Decision stats

**monthly_forecast_engine.py**
- **Fonction** : `forecast_monthly_throughput(operator_id, month, config)`
- **Méthodes** :
  - **Seasonal Naive Baseline**: Baseline par weekday/hour
  - **EWMA Smoothing**: Exponentially Weighted Moving Average pour la tendance
  - **Saturation Risk Scoring**: Sigmoid function sur la difference forecast/plan
- **Output** :
  - Forecast total trucks
  - Forecast buckets (slot_start, predicted_trucks, saturation_risk)
  - High-risk windows
  - Planning quality assessment

---

### 5. **AGNO Runtime** (`app/agno_runtime/`)

Intégration LLM pour orchestration intelligente avec Google Gemini.

#### Structure Actuelle

```
app/agno_runtime/
├── __init__.py
├── config.py                       # Configuration AGNO
├── llm_provider.py                 # Google Gemini client
├── intent_classifier.py            # Classification d'intent LLM
├── message_polisher.py             # Polissage réponses
├── operator_analytics_polish.py    # Narratives analytics
├── prompts.py                      # Prompts LLM
└── (7 files total)
```

#### Fonctionnalités

**intent_classifier.py**
- Classification sémantique des intents via Prompt Engineering
- Confidence scoring
- Gestion des cas "Unknown"

**message_polisher.py**
- Adaptation langue utilisateur (FR/EN/Darija)
- Ton professionnel
- Clarté et concision

**operator_analytics_polish.py**
- Génération executive summary
- Génération key findings
- Narratives pour analytics opérateur

---

### 6. **Tools & Clients** (`app/tools/`)

Clients HTTP pour communiquer avec les backend services.

#### Structure Actuelle

```
app/tools/
├── __init__.py
├── nest_client.py              # NestJS (:3001)
├── booking_service_client.py   # Booking (:3002)
├── booking_write_client.py     # Booking write ops
├── slot_service_client.py      # Slot (:3003)
├── carrier_service_client.py   # Carrier (:3004)
├── analytics_data_client.py    # Analytics (:3005)
├── blockchain_service_client.py# Blockchain (:3010)
├── stt_service_client.py       # STT service
├── time_tool.py                # Utilitaires temps
├── blockchain_tool.py          # Utilitaires blockchain
└── (11 files total)
```

#### Connection Pooling

**Pattern singleton** pour réutiliser les connexions :

```python
# Exemple: booking_write_client.py
_client: Optional[httpx.AsyncClient] = None

def get_client() -> httpx.AsyncClient:
    """Retourne le client singleton (connection pooling)."""
    global _client
    if _client is None:
        from app.core.config import settings
        _client = httpx.AsyncClient(
            timeout=settings.BOOKING_WRITE_CLIENT_TIMEOUT,
            limits=httpx.Limits(
                max_connections=settings.BOOKING_WRITE_CLIENT_MAX_CONNECTIONS,
                max_keepalive_connections=20
            )
        )
    return _client

async def close_client():
    """Ferme le client (graceful shutdown)."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
```

---

### 7. **Schemas** (`app/schemas/`)

Pydantic models pour validation.

#### Structure Actuelle

```
app/schemas/
├── __init__.py
├── base.py                     # BaseResponse, Proof, Error
├── chat.py                     # ChatRequest, ChatResponse
├── stt.py                      # STT schemas
├── operator_analytics.py       # Operator analytics schemas
├── stress.py                   # Stress index schemas
├── booking.py                  # Booking schemas
├── slot.py                     # Slot schemas
├── carrier.py                  # Carrier schemas
├── traffic.py                  # Traffic schemas
├── anomaly.py                  # Anomaly schemas
└── (11 files total)
```

---

## 📡 Endpoints API

### Authentication & RBAC

Tous les endpoints (sauf `/health`, `/stt/*`) nécessitent :

**Headers** :
```
Authorization: Bearer <token>
x-user-role: ADMIN | OPERATOR | CARRIER | ANON
x-user-id: <user_id>
x-carrier-id: <carrier_id>  # Pour CARRIER role uniquement
x-request-id: <trace_id>     # Optionnel (généré auto sinon)
```

**Règles RBAC** :

| Endpoint | ADMIN | OPERATOR | CARRIER | PUBLIC |
|----------|-------|----------|---------|--------|
| `/health` | ✅ | ✅ | ✅ | ✅ |
| `/api/chat` | ✅ | ✅ | ✅ | ❌ |
| `/api/chat/voice` | ✅ | ✅ | ✅ | ✅ (limited) |
| `/api/slots/availability` | ✅ | ✅ | ✅ | ✅ (limited) |
| `/api/slots/recommend` | ✅ | ✅ | ✅ | ❌ |
| `/api/operator/*` | ✅ | ✅ | ❌ | ❌ |
| `/api/analytics/*` | ✅ | ✅ | ❌ | ❌ |
| `/api/stt/*` | ✅ | ✅ | ✅ | ✅ |
| `/api/admin/*` | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 Guide d'Extension

### Ajouter un Nouvel Agent

1. **Créer le fichier agent** : `app/agents/my_new_agent.py`

```python
from app.agents.base_agent import BaseAgent

class MyNewAgent(BaseAgent):
    async def execute(self, context: dict) -> dict:
        # 1. Extract entities
        entity = context["entities"].get("my_entity")
        
        # 2. Fetch data from backend
        from app.tools import my_service_client
        data = await my_service_client.get_data(entity)
        
        # 3. Process with algorithm
        from app.algorithms import my_algorithm
        result = my_algorithm.process(data)
        
        # 4. Return formatted response
        return {
            "message": f"Processed {entity}",
            "data": result,
            "proofs": {
                "trace_id": context["trace_id"],
                "agent": "my_new_agent"
            }
        }
```

2. **Enregistrer l'agent** : `app/agents/registry.py`

```python
from app.agents.my_new_agent import MyNewAgent

AGENT_REGISTRY = {
    # ... existing agents
    "my_new_intent": MyNewAgent(),
}
```

3. **Ajouter l'intent** : `app/constants/intents.py`

```python
MY_NEW_INTENT = "my_new_intent"
```

4. **Ajouter les patterns** : `app/orchestrator/intent_detector.py`

```python
INTENT_PATTERNS = {
    # ... existing patterns
    "my_new_intent": [
        r"my pattern (?P<my_entity>\w+)",
    ]
}
```

---

## ⚙️ Configuration & Déploiement

### Variables d'Environnement

```env
# Core Services
NEST_BASE_URL=http://localhost:3000
BOOKING_SERVICE_URL=http://localhost:3002
SLOT_SERVICE_URL=http://localhost:3003
CARRIER_SERVICE_URL=http://localhost:3004
ANALYTICS_SERVICE_URL=http://localhost:3005
BLOCKCHAIN_SERVICE_URL=http://localhost:3010

# STT Configuration
STT_ENABLED=true
STT_PROVIDER=local_whisper
STT_MODEL_SIZE=medium
STT_DEVICE=cpu
STT_COMPUTE_TYPE=int8
STT_MAX_AUDIO_MB=15
STT_TIMEOUT=30.0

# AGNO Intelligent Orchestration
AGNO_ENABLED=true
GOOGLE_AI_STUDIO_API_KEY=your-api-key
LLM_MODEL_NAME=gemini-1.5-pro
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=1024
LLM_TIMEOUT_SECONDS=20
INTENT_CONFIDENCE_THRESHOLD=0.45
LLM_DEBUG=false

# Application
LOG_LEVEL=INFO
ENVIRONMENT=production
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./conversations.db
```

### Déploiement Production

**Checklist** :
1. ✅ Configurer toutes les URLs des services backend
2. ✅ Activer HTTPS pour tous les endpoints
3. ✅ Configurer CORS pour les origines autorisées
4. ✅ Définir `ENVIRONMENT=production`
5. ✅ Définir `LOG_LEVEL=INFO` ou `WARNING`
6. ✅ Vérifier la santé des services backend (`/api/admin/health/services`)
7. ✅ Tester l'enforcement RBAC
8. ✅ Load test des endpoints critiques
9. ✅ Configurer monitoring et alerting
10. ✅ Configurer backup de la base de données conversations

**Commande de démarrage** :
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📊 Métriques & Monitoring

### Endpoints de Santé

- `GET /health` - Santé globale du service
- `GET /api/admin/health/services` - Santé des services backend
