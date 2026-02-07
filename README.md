# Port Booking System - Backend

A robust, scalable backend system for managing port terminal bookings, built with modern enterprise-grade technologies and cloud-native architecture.

## Overview

This system provides a comprehensive API for managing port operations, including bookings, gate control, real-time notifications, AI-powered recommendations, and blockchain-based audit trails. Designed for high availability and horizontal scalability.

## Technology Stack

### Core Framework
- **NestJS** - Enterprise-grade Node.js framework with TypeScript
  - Modular architecture for maintainability
  - Built-in dependency injection
  - Excellent for microservices and monoliths

### Database & ORM
- **PostgreSQL** - ACID-compliant relational database
  - Robust data integrity
  - Advanced indexing and query optimization
  - Support for complex relationships
- **Prisma ORM** - Type-safe database access
  - Auto-generated types
  - Database migrations
  - Excellent developer experience

### Caching & Performance
- **Redis** - In-memory data store
  - Session management
  - Caching layer for analytics
  - Rate limiting
  - Real-time pub/sub for WebSockets

### Real-time Communication
- **Socket.IO** - Bi-directional event-based communication
  - Real-time notifications
  - WebSocket gateway with JWT authentication
  - Room-based messaging (user-specific, role-specific)

### AI & Intelligence
- **FastAPI AI Service** (Python)
  - AI-powered slot recommendations
  - Chat-based assistant with natural language processing
  - Integration with Google Gemini for LLM capabilities
  - Speech-to-text support (Whisper)

### Blockchain Integration
- **Ethers.js** - Ethereum blockchain integration
  - Immutable audit trail
  - Smart contract interaction
  - Notarization of critical events

### Authentication & Security
- **JWT** - JSON Web Tokens for stateless authentication
- **bcrypt** - Password hashing
- **Guards & Interceptors** - Request validation and transformation
- **Rate Limiting** - DDoS protection with @nestjs/throttler

### API Documentation
- **Swagger/OpenAPI** - Auto-generated interactive API documentation
  - Available at `/api` endpoint
  - Complete schema definitions
  - Try-it-out functionality

### Email & Notifications
- **Resend** - Modern email delivery service
- **Firebase Admin** - Push notifications to mobile devices

## Architecture Highlights

### Scalability Features

1. **Stateless Design**
   - JWT-based authentication (no server-side sessions)
   - Enables horizontal scaling across multiple instances
   - Session data stored in Redis for distributed access

2. **Caching Strategy**
   - Redis-based caching for analytics and metrics
   - Configurable TTL (Time To Live)
   - Reduces database load by up to 80%

3. **Database Optimization**
   - Indexed columns for fast lookups
   - Connection pooling via Prisma
   - Optimized queries with selective field loading

4. **Microservices Ready**
   - Modular architecture (UserModule, BookingsModule, etc.)
   - Each module can be extracted into a separate service
   - API Gateway pattern supported

### Robustness & Reliability

1. **Error Handling**
   - Global exception filters
   - Structured error responses
   - Detailed logging for debugging

2. **Validation**
   - DTO (Data Transfer Object) validation with class-validator
   - Schema validation at API boundary
   - Type safety with TypeScript

3. **Audit Trail**
   - Comprehensive logging of all critical operations
   - AuditLog module tracks user actions
   - Blockchain notarization for immutability

4. **Health Checks**
   - Database connectivity monitoring
   - Service health endpoints
   - Graceful shutdown handling

5. **Rate Limiting**
   - Configurable throttling (default: 10 requests/60 seconds)
   - Per-user rate limiting
   - Protection against abuse

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL (or use Docker)

### One-Command Startup

Start the entire system (Backend, AI Service, PostgreSQL, Redis):

```bash
docker compose up --build -d
```

This will:
1. Build the backend (NestJS) image
2. Build the AI service (FastAPI) image
3. Start PostgreSQL database
4. Start Redis cache
5. Run database migrations automatically
6. Seed initial data

### Verify Services

Check all services are running:
```bash
docker compose ps
```

Access the API documentation:
```
http://localhost:3000/api
```

Check backend health:
```bash
curl http://localhost:3000/api
```

Check AI service health:
```bash
curl http://localhost:8000/health
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Bookings
- `GET /api/bookings` - List all bookings (paginated)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user

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

Run the demo script to verify all functionality:
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
