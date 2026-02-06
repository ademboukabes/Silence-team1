# 🚢 Smart Port Logistics Hub
### *Revolutionizing Port Traffic Orchestration*

> **"A high-performance digital gatekeeper designed to eliminate port congestion through AI-ready orchestration and Blockchain traceability."**

![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Blockchain](https://img.shields.io/badge/Web3-Notary-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)
![AI-Ready](https://img.shields.io/badge/AI-Ready-00ADD8?style=for-the-badge&logo=google-cloud&logoColor=white)
![Real-Time](https://img.shields.io/badge/RealTime-Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🌟 The Vision
Port terminals are the lungs of global trade, but they are often choked by unpredictable truck arrivals. Our solution provides a **Digital Notary and Traffic Controller** that guarantees:
- **Zero Congestion**: Mathematical enforcement of terminal capacity.
- **Absolute Trust**: Every movement is notarized on the Blockchain.
- **Total Visibility**: Real-time dashboards for operators and mobile apps for carriers.

---

## ✨ Key Innovations

### 1. 🎫 Intelligent Booking Engine
Unlike traditional systems, our booking engine uses **Atomic Capacity Checks**. It links every booking to a specific `TimeSlot` and `Gate`, preventing trucks from even departing if the port is full.

### 2. ⛓️ Blockchain Immutable Notary
We've implemented a **Blockchain Notary Service** that generates SHA-256 evidence for every booking and passage. This provides a "Source of Truth" that cannot be altered, even by database administrators.

### 3. ⚡ Real-Time Orchestration
Using **WebSockets (Socket.io)**, terminal operators receive instant alerts:
- 📢 **New Bookings**: Immediate awareness of incoming traffic.
- ⚠️ **Capacity Warnings**: Visual alerts when a gate reaches 90% load.
- 🚚 **Passage Confirmation**: Instant validation of trucks crossing the gate.

### 4. 🤖 AI-Agent Ready
The platform exposes **semantic endpoints** specifically designed for AI agents. They can query "Slot Availability" and "Historical Flux" in formats optimized for LLM processing.

---

## 🚀 Getting Started (1-Click Start)

The entire ecosystem (PostgreSQL + NestJS API) is fully containerized. **No local setup is required** besides Docker.

```bash
# 1. Clone the repository
git clone https://github.com/ademboukabes/MicroHack-3-.git

# 2. Launch EVERYTHING with a single command
docker compose up --build
```

### ⚡ What happens when you run this?
- **PostgreSQL Container**: Boots up with persistent storage.
- **NestJS Backend**: Compiles and waits for the DB to be healthy.
- **Auto-Migration**: Database schema is automatically synchronized.
- **Auto-Seeding**: **The system automatically injects demo data** (Ports, Operators, Carriers, and Slots) so you can start testing immediately!

> **Access Points**:
> - **Interactive API (Swagger)**: `http://localhost:3000/api`
> - **Real-time Gateway**: `ws://localhost:3000`

---

## 🛠️ Performance & Scalability
- **Multi-Stage Docker Builds**: Optimized for minimal production footprints.
- **Hybrid Storage**: PostgreSQL for operational speed + Blockchain for legal audit.
- **Strict Typing**: Full TypeScript coverage and `class-validator` for impenetrable API safety.

---

## 📚 Documentation
- **[Technical Deep Dive](file:///c:/Users/TUF/Documents/MicroHack-3-/TECH_DOCS.md)** - Architecture, ERD, and Module details.
- **[API Specs](http://localhost:3000/api)** - Live interactive Swagger documentation.

---

## 🧪 Verification & Demo

We provide a specialized suite of scripts to validate the platform's features, now organized in the `scripts/` directory.

### Quick Test Execution
```bash
# Complete system workflow demo (recommended)
node scripts/demo.js

# Individual feature tests
node scripts/test_api.js              # Auth & Core Logic
node scripts/test_gate_control.js     # IoT Gate Validation
node scripts/test_websocket.js        # Real-time Events
node scripts/test_blockchain.ts       # Blockchain Fallback (ts-node required)
```

---

## 🏆 Developed for MicroHack 3
**Goal**: Elevating Algerian Logistics through Innovation.
**Team**: ademboukabes & Co.

---
*Immutable. Efficient. Real-time. This is the future of Port Logistics.*
