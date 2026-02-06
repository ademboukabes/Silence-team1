# 🛠 Rapport d'Audit Technique Backend (NestJS + FastAPI)

Ce rapport détaille l'état actuel de l'architecture, le registre des endpoints, et les flux logiques critiques du système Smart Port Logistics.

---

## 1. 🏗 Architecture & Communication Inter-Services

### État de la Communication
*   **FastAPI (IA) ➔ NestJS (Core)** : ✅ **Opérationnel**
    *   Le service FastAPI appelle NestJS via des clients HTTP dédiés (`nest_client.py`, `booking_service_client.py`).
    *   **⚠️ Attention** : La configuration par défaut dans les scripts Python pointe vers le port `3001` ou `3002`. Assurez-vous que NestJS tourne sur le bon port (via Docker link `http://backend:3000` en production).

*   **NestJS (Core) ➔ FastAPI (IA)** : ❌ **Simulé (Mock)**
    *   Le `AiController` ('/ai/chat') dans NestJS renvoie actuellement une réponse statique hardcodée. Il ne contacte pas réellement le service FastAPI.
    *   **Recommandation** : Le Frontend devrait appeler directement FastAPI pour le chat (`http://localhost:8000/api/chat`) pour contourner ce mock, ou le `AiController` doit être implémenté pour faire proxy.

---

## 2. 📚 Registre des Endpoints (Catalogue Technique)

### 🔐 Module Auth (`AuthController`)
| Méthode | Chemin | Description | Request Body | Response | Guards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Inscription nouvel utilisateur | `{ name, email, password, role?, terminalId?, carrierId? }` | `{ access_token }` | Aucun |
| `POST` | `/auth/login` | Connexion utilisateur | `{ email, password }` | `{ access_token }` | Aucun |
| `GET` | `/auth/profile` | Récupérer infos utilisateur courant | - | `{ id, email, role, ... }` | `AuthGuard` |

### 📅 Module Bookings (`BookingsController`)
*Guards Globaux : `AuthGuard`, `RolesGuard`*

| Méthode | Chemin | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/bookings` | Créer une réservation | `{ gateId, truckId, carrierId, timeSlotId, notes }` | Objet Booking complet |
| `PUT` | `/bookings/:id/status` | Valider une résa (Action: CONFIRM/REJECT/CANCEL) | `{ action: "..." }` | Booking mis à jour + **Blockchain Tx** |
| `GET` | `/bookings` | Liste toutes les résas | - | Array of Booking |
| `GET` | `/bookings/:id` | Détail d'une résa | - | Booking Detail |

### 🚧 Module Gates (`GateController`)
*⚠️ **Sécurité** : Aucun Guard (Auth/Role) n'est appliqué sur ce contrôleur dans le code actuel. À corriger d'urgence.*

| Méthode | Chemin | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/gates` | Créer une porte | `{ name, terminalId, type }` | Gate |
| `GET` | `/gates` | Lister les portes | - | Array of Gate |
| `POST` | `/gates/:id/slots` | Ajouter créneau horaire | `{ startTime, endTime, maxCapacity }` | TimeSlot |
| `POST` | `/gates/:id/validate-entry` | **Action Critique** : Valider entrée camion | `{ bookingId, qrCode }` | `{ success: boolean, booking: {...} }` |

### 💬 Module Chat (NestJS - `ChatController`)
*Utilisé par le service IA pour persister les messages.*
*Guards Globaux : `AuthGuard`, `RolesGuard`*

| Méthode | Chemin | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat/conversations` | Initier conversation | `{ userId, userRole }` |
| `POST` | `/chat/conversations/:id/messages` | Ajouter message | `{ role, content, intent?, metadata? }` |
| `GET` | `/chat/conversations/:id` | Historique messages | Query: `?limit=10&offset=0` |

### 🤖 Module IA (API FastAPI)
*Base URL: `http://localhost:8000`*

| Méthode | Chemin | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | **Endpoint Principal IA** | `{ message, user_id, user_role, conversation_id? }` |
| `GET` | `/api/analytics/stress-index` | Calcul index de congestion | Query: `?terminal=A` |
| `GET` | `/api/traffic/forecast` | Prévision trafic (Mock capable) | Query: `?horizon_hours=24` |

---

## 3. 🧠 Logique de l'Agent IA

L'IA (FastAPI) agit comme un **Orchestrateur Intelligent**. Elle ne stocke rien elle-même mais utilise NestJS comme base de données.

**Capacités (Tools) :**
1.  **Mémoire (NestJS)** : Peut créer des conversations, lire l'historique et sauvegarder les messages via `nest_client.py`.
2.  **Consultation Bookings** : Peut vérifier le statut d'une ou plusieurs réservations via `booking_service_client.py` (simulant un utilisateur qui demande "Où en est ma commande ?").
3.  **Analytics & Trafic** : Peut appeler des modules internes Python pour calculer des métriques complexes (Stress Index) qui ne s'appuient pas sur des CRUD simples.

**Flux de Données (Exemple : "Je veux réserver") :**
1.  Frontend envoie message à FastAPI (`/api/chat`).
2.  FastAPI analyse l'intention (Intent Recognition).
3.  **Si besoin data** : FastAPI appelle NestJS pour voir les slots disponibles (via API ou client DB direct si configuré - ici via API sim).
4.  **Si besoin action** : FastAPI renvoie un JSON structuré (`data: { slots: [...] }`) au Frontend.
5.  **Le Frontend** (et non l'IA) déclenche l'appel final `POST /bookings` vers NestJS. *L'IA ne crée pas directement la réservation en écriture pour (sécurité).*

---

## 4. ⚡ Événements Temps Réel (WebSockets)

Liste exhaustive des événements émis par `BookingsService` et `GateService`.

| Événement | Source | Payload JSON | Description |
| :--- | :--- | :--- | :--- |
| `BOOKING_CREATED` | `BookingsService` | `{ terminalId: "ALL", bookingId, slotTime }` | Nouvelle réservation créée. Alerte les opérateurs. |
| `CAPACITY_ALERT` | `BookingsService` | `{ gateId, gateName, currentLoad, maxCapacity }` | Émis si remplissage > 90% lors d'une réservation. |
| `GATE_PASSAGE` | `GateService` | `{ gateId, gateName, bookingId, truckPlate, status, timestamp }` | Camion validé à l'entrée. Met à jour les dashboards en temps réel. |

---

## 5. ⛓️ Blockchain & Audit

### Blockchain (Notarisation)
Le `BlockchainService` est déclenché automatiquement ("Fire and Forget") lors de deux événements majeurs :
1.  **Confirmation de Réservation** (`updateBookingStatus`) : Enregistre `id`, `carrier`, `truck`, `gate`, `timeSlot`, `user`.
2.  **Passage à la Porte** (`validateEntry`) : Enregistre `id`, `truck`, `gate`, `passageTime`, `status: ENTRY_GRANTED`.

*Note : Les données sont hachées (SHA-256) avant envoi au Smart Contract pour garantir l'intégrité sans exposer les données brutes publiquement (GDPR compliance).*

### Module Audit
Chaque action sensible génère une entrée dans la table `AuditLog` via `AuditLogService` :
*   `CREATE_BOOKING`
*   `CONFIRM_BOOKING` / `REJECT_BOOKING`
*   `GATE_PASSAGE`
*   `BLOCKCHAIN_NOTARIZATION_SUCCESS` / `FAILED` (Permet de tracer si la blockchain a bien reçu la donnée).

---

## 🚨 Points d'Attention Immédiats
1.  **Sécurité Gates** : Ajouter `@UseGuards(AuthGuard, RolesGuard)` dans `GateController`. Actuellement, n'importe qui peut valider une entrée ou créer une porte.
2.  **Port Mismatch** : Vérifier la variable d'env `NEST_BACKEND_URL` côté Python. Elle pointe souvent vers 3001/3002 par défaut dans le code, alors que NestJS tourne sur 3000.
