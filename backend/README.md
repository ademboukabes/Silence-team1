# 🚀 APCS-Booking  
**AI-Powered Multi-Agent Booking System**

> APCS-Booking est une plateforme intelligente de réservation développée dans le cadre d’un **hackathon**, combinant une **architecture backend moderne** et un **système d’intelligence artificielle multi-agents** pour automatiser la compréhension des demandes utilisateurs et la gestion des réservations.

---

## 🧠 Table des matières

1. Présentation  
2. Objectifs du projet  
3. Architecture globale  
4. AI System – Architecture Multi-Agents  
5. Fonctionnalités  
6. Technologies utilisées  
7. Schémas  
8. Installation & Lancement  
9. API – Endpoints principaux  
10. DevOps & Déploiement  
11. Limites & améliorations futures  
12. Contributeurs  
13. Licence  

---

## 📘 Présentation

APCS-Booking est un système de réservation intelligent permettant aux utilisateurs d’interagir en **langage naturel** pour :
- créer une réservation,
- vérifier la disponibilité de créneaux,
- modifier ou annuler une réservation,
- recevoir des propositions alternatives automatiquement.

Le cœur du projet repose sur un **système IA multi-agents orchestré**, capable de comprendre l’intention utilisateur et de déléguer les tâches aux agents spécialisés.

---

## 🎯 Objectifs du projet

- Automatiser la gestion des réservations  
- Exploiter une IA conversationnelle multi-agents  
- Séparer clairement logique métier, orchestration et IA  
- Proposer une architecture scalable et modulaire  
- Être fonctionnel dans un contexte hackathon  

---

## 🏗️ Architecture globale

```
Frontend (Client Web)
        |
        v
Backend API (Booking Service)
        |
        v
AI Multi-Agent System
        |
        v
Database
```

---

## 🤖 AI System – Architecture Multi-Agents

Le système IA est basé sur un **Orchestrator Agent** central coordonnant plusieurs agents spécialisés.

### Agents :
- Orchestrator Agent  
- Intent Classification Agent  
- Entity Extraction Agent  
- Booking Agent  
- Availability (Slot) Agent  
- Context & Memory Agent  

---

## 📊 Schéma du workflow IA

```mermaid
flowchart TD
    User --> Orchestrator
    Orchestrator --> Intent
    Orchestrator --> Entity
    Intent --> Booking
    Intent --> Slot
    Booking --> DB
    Slot --> DB
    DB --> Orchestrator
    Orchestrator --> User
```

---

## ⚙️ Fonctionnalités

### Core
- Création, modification et annulation de réservations  
- Gestion des créneaux horaires  
- API REST documentée  

### IA
- Interaction en langage naturel  
- Orchestration multi-agents  
- Extraction automatique des entités  
- Suggestions intelligentes  

---

## 🛠️ Technologies utilisées

### Backend
- Python  
- FastAPI / Flask  
- REST API  

### AI System
- Large Language Models (LLM)  
- Architecture Multi-Agents  
- Prompt Engineering  
- Intent Classification  
- Entity Extraction  

### DevOps
- Docker  
- Docker Compose  

---

## 🚀 Installation & Lancement

```bash
git clone https://github.com/0xHouss/apcs-booking.git
cd apcs-booking
docker compose up -d
```

Backend : http://localhost:3000
Docs API : http://localhost:8000/docs  

---

## 📡 API – Endpoints principaux

| Méthode | Endpoint | Description |
|-------|---------|------------|
| GET | /bookings | Liste des réservations |
| POST | /bookings | Créer une réservation |
| PUT | /bookings/{id} | Modifier |
| DELETE | /bookings/{id} | Annuler |
| POST | /ai/chat | Chat IA multi-agents |

---

## 🚧 Limites & améliorations futures

- Mémoire IA persistante  
- Prédiction de charge  
- Monitoring des agents  
- Frontend conversationnel avancé  

---

## 👥 Contributeurs

Projet développé dans le cadre d’un **hackathon** par l’équipe APCS.

### Ports, Terminals & Gates
- `GET /api/ports` - List all ports
- `GET /api/terminals` - List terminals
- `GET /api/gates` - List gates and availability

### AI Services
- `GET /api/ai/slot-availability` - Get AI-recommended time slots
- `POST /api/ai/chat` - Interact with AI assistant

### Analytics (Admin/Operator)
- `GET /api/analytics/metrics` - Get booking metrics
- `GET /api/analytics/operator/:id` - Operator-specific analytics

### Notifications
- `GET /api/notification` - Get user notifications
- `POST /api/notification/register-device` - Register device for push notifications

### WebSocket Events
Connect to `ws://localhost:3000` with JWT token:
- `notification` - Receive real-time notifications
- `booking_update` - Booking status changes

## Environment Variables

### Backend (`backend/backend.env`)
```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=booking-apits
POSTGRES_USER=postgres
POSTGRES_PASSWORD=kashmar552
DATABASE_URL=postgresql://postgres:kashmar552@postgres:5432/booking-apits?schema=public

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Blockchain
BLOCKCHAIN_RPC_URL=http://your-rpc-url
BLOCKCHAIN_PRIVATE_KEY=your-private-key
BLOCKCHAIN_CONTRACT_ADDRESS=0x...

# Email
RESEND_API_KEY=your-resend-api-key
```

### AI Service (`ai/ai.env`)
```env
# Backend Integration
NEST_BACKEND_URL=http://backend:3000

# LLM Configuration
GOOGLE_API_KEY=your-google-api-key
GEMINI_MODEL=gemini-1.5-pro
```

## User Roles

### ADMIN
- Full system access
- User management
- Analytics and reports
- System configuration

### OPERATOR
- Terminal-specific operations
- Approve/reject bookings
- Gate control
- Terminal analytics

### CARRIER
- Create bookings
- View own bookings
- Manage trucks and drivers
- Receive notifications

## Development

### Local Development (without Docker)

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up PostgreSQL and update `backend.env`

3. Run migrations:
```bash
npx prisma db push
npx prisma db seed
```

4. Start development server:
```bash
npm run start:dev
```

### Database Commands

Generate Prisma Client:
```bash
npx prisma generate
```

View database in Prisma Studio:
```bash
npx prisma studio
```

Create migration:
```bash
npx prisma migrate dev --name migration_name
```

## Production Deployment

### Docker Compose Production

```bash
docker compose -f compose.yml up -d
```

### Environment Checklist
- [ ] Update all passwords in `backend.env`
- [ ] Configure Resend API key for emails
- [ ] Set up blockchain RPC endpoint
- [ ] Configure Firebase for push notifications
- [ ] Set production `GOOGLE_API_KEY` for AI
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging

### Scaling Recommendations

1. **Horizontal Scaling**
   - Deploy multiple backend instances behind a load balancer
   - Use Redis for shared session storage
   - Database: Consider read replicas for heavy read workloads

2. **Database Optimization**
   - Enable connection pooling (configured in Prisma)
   - Add database indexes based on query patterns
   - Consider partitioning large tables (bookings, audit logs)

3. **Caching**
   - Increase Redis memory for larger cache
   - Implement cache warming for frequently accessed data
   - Use CDN for static assets

4. **Monitoring**
   - Set up APM (Application Performance Monitoring)
   - Monitor Redis and PostgreSQL metrics
   - Track API response times and error rates

## Testing

Run comprehensive system tests to verify all functionality:
```bash
cd backend
node scripts/test_all.js
```

This script validates:
- Authentication & Role Management
- Infrastructure & Metadata Discovery
- Driver-Centric Booking Workflow
- Operator Unified Status Control
- IoT Gate Security & Validation
- AI Analytics & Blockchain Audit
- Rate Limiting & Security Controls

Run the demo script for quick system verification:
```bash
cd backend
node scripts/demo.js
```

## Support & Documentation

- **Swagger UI**: http://localhost:3000/api
- **Prisma Studio**: `npx prisma studio` (view database)
- **Logs**: `docker compose logs -f backend`

## License

Proprietary - All rights reserved
