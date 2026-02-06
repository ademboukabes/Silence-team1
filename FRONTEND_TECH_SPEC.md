# Guide Technique Frontend (Smart Port Logistics)
**Version Corrigée - Basée sur le Backend Actuel**

Ce document est généré à partir de l'analyse stricte du code backend (NestJS/Prisma). Il sert de référence unique pour le développement de l'interface utilisateur.

---

## 1. 🏗 Contrat de Données (TypeScript Interfaces)

Interfaces extraites directement du schéma Prisma (`prisma/schema.prisma`).

### Enums

```typescript
export enum Role {
  CARRIER = 'CARRIER',
  TERMINAL_OPERATOR = 'TERMINAL_OPERATOR',
  PORT_ADMIN = 'PORT_ADMIN',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CONSUMED = 'CONSUMED',
  CANCELLED = 'CANCELLED'
}

export enum GateType {
  IN = 'IN',
  OUT = 'OUT',
  GENERIC = 'GENERIC'
}
```

### Entités Principales

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  birthDate?: string; // ISO Date
  nin?: string; // National Identity Number (18 chars)
  carrierId?: number;
  terminalId?: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Truck {
  id: number;
  licensePlate: string; // Unique
  driverName?: string;
  carrierId: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Booking {
  id: string;              // ⚠️ UUID (clé primaire unique)
  status: BookingStatus;
  qrCode?: string;         // Généré lors de la confirmation
  notes?: string;
  gateId: number;
  truckId: number;
  carrierId: number;
  timeSlotId: number;
  userId: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date

  // Informations Chauffeur (Refonte Real Port Workflow)
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  driverMatricule: string;
  merchandiseDescription?: string;

  // Relations souvent incluses dans les réponses
  truck?: Truck;
  gate?: Gate;
  timeSlot?: TimeSlot;
  carrier?: Carrier;
  user?: User;
}

export interface TimeSlot {
  id: number;
  gateId: number;
  startTime: string; // ISO Date
  endTime: string; // ISO Date
  maxCapacity: number;
  currentBookings: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Gate {
  id: number;
  name: string;
  type: GateType;
  terminalId: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Carrier {
  id: number;
  name: string;
  code: string;          // Unique
  contactEmail?: string;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}
```

---

## 2. 🔌 Spécifications API REST

**Base URL**: `http://localhost:3000/api`

### 🔐 Authentification (`/auth`)

| Méthode | Endpoint | Body (JSON) | Réponse | Notes |
|---------|----------|-------------|---------|-------|
| `POST` | `/signup` | `{ name, email, password, role?, firstName?, lastName?, birthDate?, nin?, carrierId?, terminalId? }` | `{ message, user: User, access_token: string }` | Le rôle par défaut est `CARRIER`. Token également stocké dans cookie HttpOnly. |
| `POST` | `/login` | `{ email, password }` | `{ message, user: User, access_token: string }` | Token également stocké dans cookie HttpOnly. |
| `POST` | `/logout` | - | `{ message }` | Efface le cookie `access_token`. |
| `GET` | `/profile` | - | `User` | **Nécessite** `Authorization: Bearer <token>` |

---

### 🚚 Camions (`/trucks`)

**Protection**: Nécessite `AuthGuard`

| Méthode | Endpoint | Body | Réponse | Logique Métier |
|---------|----------|------|---------|----------------|
| `POST` | `/` | `{ licensePlate, driverName?, carrierId }` | `Truck` | Création de camion. |
| `GET` | `/` | - | `Truck[]` | Liste tous les camions. |
| `GET` | `/:id` | - | `Truck` | Récupère un camion par ID. |

---

### 📅 Réservations (`/bookings`)

**Protection**: Nécessite `AuthGuard` + `RolesGuard`

| Méthode | Endpoint | Body | Réponse | Logique Métier |
|---------|----------|------|---------|----------------|
| `POST` | `/` | `{ gateId, truckId, carrierId, timeSlotId, driverName, driverEmail, driverPhone, driverMatricule, merchandiseDescription?, notes? }` | `Booking` | Crée une réservation en `PENDING`. Vérifie la capacité du slot. |
| `GET` | `/` | - | `Booking[]` | Liste toutes les réservations. |
| `GET` | `/:id` | - | `Booking` | Récupère une réservation par ID (UUID). |
| `PUT` | `/:id/status` | - | `Booking` | **Unified Endpoint**. Change statut (`CONFIRMED`, `REJECTED`, `CANCELLED`). Logique de QR/Blockchain intégrée. |

---

### 🚧 Infrastructure (`/gates`)

**Protection**: Nécessite `AuthGuard` + `RolesGuard`

| Méthode | Endpoint | Body | Réponse | Notes |
|---------|----------|------|---------|-------|
| `POST` | `/` | `{ name, type, terminalId }` | `Gate` | Création de porte. |
| `GET` | `/` | - | `Gate[]` | Liste toutes les portes. |
| `GET` | `/:id` | - | `Gate` | Récupère une porte avec ses slots. |
| `POST` | `/:id/slots` | `{ startTime, endTime, maxCapacity }` | `TimeSlot` | Ajoute un créneau. |
| `POST` | `/:id/validate-entry` | `{ bookingId }` | `{ success, message, booking }` | **Simule le scan IoT**. UUID requis. |

---

## 3. 📡 Événements Temps Réel (WebSockets)

**Protocole**: Socket.io  
**Namespace**: `/` (Default)  

### Événements Émis (Server → Client)

| Événement | Payload | Description |
|-----------|---------|-------------|
| `BOOKING_STATUS_CHANGED` | `{ bookingId, newStatus }` | Notification de changement de statut. |
| `BOOKING_CREATED` | `{ terminalId, bookingId, slotTime }` | Nouvelle requête (Operator). |
| `CAPACITY_ALERT` | `{ gateId, gateName, currentLoad, maxCapacity }` | Alerte capacité (Operator). |
| `GATE_PASSAGE` | `{ gateId, gateName, bookingRef, truckPlate, status }` | Notification de passage. |

---

## 4. 🧩 Cycle de Vie d'un Booking

```
PENDING (Initial) ─► CONFIRMED ─► CONSUMED (Fin)
      │               │
      └──► REJECTED   └──► CANCELLED
```

---

## 5. 🎯 Checklist Développeur Frontend

- [ ] Utiliser `string` (UUID) pour `Booking.id`.
- [ ] Gérer l'authentification avec le `access_token` (JWT).
- [ ] Implémenter Socket.io pour les notifications temps réel.
- [ ] Afficher les QR codes via l'URL `booking.qrCode`.
- [ ] Différencier les vues selon les rôles (`CARRIER` vs `OPERATOR`).

---

**Version**: 1.1 (Sans dépendances IA)  
**Date**: 2026-02-06
