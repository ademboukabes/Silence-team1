# 📖 Spécification Complète du Backend (Smart Port Logistics)

Ce document constitue le référentiel maître décrivant le fonctionnement interne, les API, et les intégrations du système de contrôle d'accès logistique maritime.

---

## 1. 📂 Architecture des Modules (NestJS)

Le backend est découpé en modules autonomes mais interconnectés :

| Module | Rôle Exact | Dépendances Clés |
| :--- | :--- | :--- |
| **AuthModule** | Gestion des identités, émission de JWT, et sécurisation des routes. | `JwtModule`, `LocalStrategy` |
| **UserModule** | CRUD des utilisateurs et gestion des profils (CARRIER, OPERATOR, etc.). | `PrismaModule` |
| **TruckModule** | Gestion de la flotte de camions. Assure l'isolation par transporteur. | `PrismaModule` |
| **BookingModule** | Cœur métier : réservations, workflow de statut, et gestion de capacité. | `PrismaModule`, `WebsocketModule`, `AuditModule`, `BlockchainModule` |
| **GateModule** | Infrastructure physique : terminaux, portes et simulation de passage. | `PrismaModule`, `WebsocketModule` |
| **AiModule** | Interface avec le service externe FastAPI pour le chat et l'optimisation. | `AxiosModule` |
| **WebsocketModule** | Communication bidirectionnelle en temps réel (events push). | `Socket.io` |
| **BlockchainModule** | Notarisation des confirmations de réservation pour preuve immuable. | `Ethers.js` |
| **AuditModule** | Traçabilité de toutes les actions sensibles du système. | `PrismaModule` |

---

## 2. 🔌 Catalogue des Endpoints API

### 🔐 Authentification & Utilisateurs (`/auth`, `/users`)

| URL | Méthode | Rôles | Input | Logique Métier | Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | JSON: `name, email, password, role, ...` | Hashage du mot de passe (Bcrypt). Validation. **Set HttpOnly Cookie**. | `{ message: "Success", user: User }` |
| `/api/auth/login` | `POST` | Public | JSON: `email, password` | Vérification des crédentials. **Set HttpOnly Cookie**. | `{ message: "Success", user: User }` |
| `/api/auth/logout` | `POST` | Authentifié | - | **Clear Cookie**. | `{ message: "Logged out" }` |
| `/api/auth/profile` | `GET` | Authentifié | - | Extraction des données du cookie `access_token`. | `User JSON` |

### 🚚 Gestion des Camions (`/trucks`)

| URL | Méthode | Rôles | Input | Logique Métier | Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/trucks` | `GET` | Authentifié | - | **CARRIER**: Filtre uniquement les camions de son entreprise. **ADMIN**: Voit tout. | `Truck[]` |
| `/api/trucks` | `POST` | Carrier, Admin | JSON: `licensePlate, type, carrierId` | Vérifie l'unicité du matricule. Si Carrier, le `carrierId` est forcé à celui du user. | `Truck` |
| `/api/trucks/:id` | `DELETE` | Carrier, Admin | Path: `id` | Vérifie que le camion appartient au Carrier avant de supprimer. | `Truck` (Supprimé) |

### 📅 Moteur de Réservation (`/bookings`)

| URL | Méthode | Rôles | Input Example | Output Example | Logique & Erreurs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/bookings` | `POST` | Carrier | `{ "gateId": 4, "truckId": 1, "timeSlotId": 5 }` | `{ "id": 10, "status": "PENDING", "bookingRef": "..." }` | **409 Conflict**: Slot plein. **403 Forbidden**: Camion n'appartient pas au Carrier. |
| `/api/bookings/:id` | `PUT` | Carrier | `{ "timeSlotId": 6 }` | `{ "id": 10, "status": "PENDING", ... }` | **Gestion de capacité** : Libère l'ancien slot, incrémente le nouveau. |
| `/api/bookings/:id/status` | `PUT` | Voir règles | `{ "action": "CONFIRM" }` | `{ "id": 10, "status": "CONFIRMED" }` | **Machine à état** : CONFIRM/REJECT/CANCEL. RBAC strict. |

#### Exemple de Payload JSON (Creation)
```json
// POST /api/bookings
{
  "gateId": 4,
  "truckId": 12,
  "timeSlotId": 52,
  "notes": "Cargo fragile"
}

// Response (201 Created)
{
  "id": 154,
  "bookingRef": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "truckId": 12,
  "gateId": 4,
  "timeSlotId": 52,
  "userId": 8,
  "createdAt": "2026-02-06T04:20:00Z"
}
```


### 🧠 Intelligence Artificielle (`/ai`)

| URL | Méthode | Rôles | Input | Logique Métier | Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Authentifié | JSON: `message, conversation_id?` | Proxy vers FastAPI. Injecte le rôle et l'historique en base. | `response_string` |
| `/api/ai/slot-availability` | `GET` | Authentifié | - | Analyse les charges des gates et suggère les slots optimaux (Dispo/Full). | `SlotStatus[]` |

---

## 3. 🛡️ Système d'Authentification (Cookie)

1.  **Fonctionnement** : Utilise des Cookies **HttpOnly, Secure, SameSite=Strict**.
    *   Le Frontend n'a PAS accès au token via JS (protection XSS).
    *   Le Frontend doit envoyer `credentials: 'include'` (ou `withCredentials: true` via Axios).
2.  **Payload du Token** :
    *   `sub` : ID de l'utilisateur.
    *   `email` : Email de l'utilisateur.
    *   `role` : Rôle métier (utilisé par le `RolesGuard`).
    *   `carrierId` : ID de l'entreprise (si applicable).
3.  **Vérification** : Chaque requête protégée passe par `AuthGuard`. Le middleware extrait le token du cookie `access_token` et vérifie la signature.

---

## 📡 4. Communication Temps Réel (WebSockets)

| Événement | Source | Trigger | Action Frontend |
| :--- | :--- | :--- | :--- |
| `BOOKING_CREATED` | Backend | Nouveau booking créé. | Opérateur : Ajout d'une ligne clignotante dans la table. |
| `BOOKING_STATUS_CHANGED` | Backend | Confirmation/Rejet/Update. | Transporteur : Toast ("Votre réservation est validée"). |
| `CAPACITY_ALERT` | Backend | Slot saturé (> 90%). | Admin/Opérateur : Icône d'alerte rouge sur la porte. |
| `SLOT_FREED` | Backend | Annulation ou Rejet. | Tous : Mise à jour du compteur de disponibilité. |
| `GATE_PASSAGE` | Backend | Camion passe la porte. | Opérateur : Log d'activité live ("Le camion X vient d'entrer"). |

---

## 🧠 5. Intelligence Artificielle

L'IA n'est pas qu'un chatbot, c'est une aide à la décision :
*   **Contexte Géré** : Le backend récupère l'historique des réservations du Carrier et le passe à l'IA pour des réponses types : *"Vous avez déjà un camion à 8h, je vous suggère 10h pour le second"*.
*   **Optimisation** : L'IA précharge les données de trafic du terminal pour équilibrer la charge entre les différentes portes (`Gate`).

---

## 🗄 6. Modèle de Données (PostgreSQL)

*   **User** : Root entity. Relations: `1:1` avec `CarrierCompany` (si rôle Carrier).
*   **Booking** : Pivot central. Relations: `N:1` avec `Truck`, `Gate`, `TimeSlot`.
*   **TimeSlot** : Contrainte d'unicité sur `startTime` par `Gate`. Dispose d'un champ `currentBookings` pour la logique de capacité.
*   **AuditLog** : Table immuable. Enregistre `action`, `entityType`, `metadata` (JSON).

---

## 🔗 7. Blockchain & Intégrité

1.  **Génération** : Uniquement lors du passage au statut `CONFIRMED`.
2.  **Contenu du Hash** : `sha256(bookingRef + truckPlate + slotTime + carrierName)`.
3.  **Stockage** : Le hash est stocké dans la colonne `blockchainHash` du Booking et optionnellement émis vers un Smart Contract (via `BlockchainService`).
4.  **Vérification** : Permet au port d'auditer en fin de journée qu'aucune réservation n'a été ajoutée "en douce" sans passer par le workflow officiel.

---

## ⚖️ 8. Règles Métier & Critiques

*   **Capacité** : Une réservation échouera (`409 Conflict`) si `currentBookings == maxCapacity`.
*   **Propriété** : Le backend vérifie systématiquement que le `truckId` passé dans un booking appartient au transporteur identifié par le token JWT (`Forbidden` sinon).
*   **Immutable** : Un booking au statut `CONSUMED` (camion déjà passé) ne peut plus être modifié ou annulé.

---

## 🚀 9. Exemple Concret de Cycle de Vie

1.  **Creation** : Carrier appelle `POST /bookings` ➔ `TimeSlot.currentBookings` passe de 0 à 1. Statut = `PENDING`. Event `BOOKING_CREATED` envoyé aux Opérateurs.
2.  **Notification** : L'opérateur voit la demande dans son dashboard temps réel.
3.  **Validation** : L'opérateur appelle `PUT /bookings/1/confirm`. Le backend génère le QR code et notarise le hash en Blockchain. Statut = `CONFIRMED`.
4.  **Réception** : Le Carrier reçoit `BOOKING_STATUS_CHANGED` via WebSocket. Il télécharge le QR code.
5.  **Passage** : Le camion arrive à la porte. L'opérateur appelle `POST /gates/1/validate-entry`. Statut = `CONSUMED`. Event `GATE_PASSAGE` émis.

---

## 🚀 11. Documentation Interactive (Swagger)

Le projet dispose d'une interface Swagger complète pour explorer et tester les API en temps réel.

*   **URL** : `http://localhost:3000/docs`
*   **Contenu** : Documentation de tous les schémas (DTOs), types de retour, et tests de requêtes intégrés.

---

Cette documentation garantit une compréhension à 100% de la tuyauterie interne et assure une coordination parfaite entre le backend et les interfaces.
