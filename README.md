# 🚢 Smart Port Logistics Hub
### *L'Orchestration Digitale au Service de la Fluidité Portuaire*

[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Blockchain](https://img.shields.io/badge/Trust-Blockchain-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethereum.org/)

---

## 🌟 Vision du Projet
Le **Smart Port Logistics Hub** est une plateforme de gestion de trafic portuaire conçue pour résoudre les problèmes de congestion et de manque de traçabilité dans les terminaux logistiques. À travers une orchestration intelligente des rendez-vous (Booking) et une notarisation immuable sur la Blockchain, nous transformons le port en un écosystème prévisible et sécurisé.

> **"Passer d'une gestion réactive à une orchestration proactive du flux de camions."**

---

## ✨ Fonctionnalités Clés

### 1. 🎫 Moteur de Réservation Intelligent (Booking)
- **Gestion fine des capacités** : Définition de slots horaires avec capacité maximale par porte (Gate) pour éviter tout goulot d'étranglement.
- **Workflow métier complet** : De la création par le transporteur (Carrier) à la validation par l'opérateur du terminal.

### 2. ⛓️ Notaire Digital sur Blockchain
- **Traçabilité absolue** : Chaque confirmation de passage et chaque réservation validée génère une preuve cryptographique (Hash SHA-256) stockée sur la Blockchain.
- **Audit immuable** : Garantie que les données de passage n'ont pas été altérées.

### 3. 💬 Centre de Communication Persistant (Nouveau)
- **Historique complet** : Sauvegarde intégrale des interactions avec les agents IA ou le support.
- **Sécurité RBAC Granulaire** : 
  - Les **Transporteurs** accèdent uniquement à leurs conversations.
  - Les **Opérateurs** supervisent les échanges liés à leur terminal.
  - Les **Admins** disposent d'une vue d'ensemble sur l'ensemble du hub.

### 4. 🤖 Interfaces optimisées pour l'IA
- **Endpoints Sémantiques** : API conçues pour être consommées par des agents intelligents, facilitant l'analyse prédictive des flux et la recherche de slots disponibles.

### 5. ⚡ Notifications & Événements Temps-Réel
- Intégration de **WebSockets** pour des alertes instantanées sur les arrivées de camions et les alertes de saturation de capacité.

---

## 🏗️ Architecture Technique

Le projet repose sur une architecture **Monolithe Modulaire** robuste :
- **Framework** : NestJS (Node.js) pour une structure maintenable et scalable.
- **Persistance** : Prisma ORM couplé à PostgreSQL.
- **Temps-Réel** : Socket.io pour la communication bidirectionnelle.
- **Web3** : Ethers.js pour l'interaction avec les Smart Contracts.

---

## 🚀 Installation & Lancement (Docker-First)


Plus besoin de configurer localement Node.js ou PostgreSQL. Le projet est entièrement conteneurisé.


### 1. Prérequis
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Lancement Rapide
```bash
# Cloner le projet
git clone https://github.com/ademboukabes/MicroHack-3-.git
cd MicroHack-3-

# Tout démarrer en une seule commande
docker compose up --build
```

### 3. Ce que Docker fait pour vous :
1. Démarre une instance **PostgreSQL** saine.
2. Compile le backend **NestJS**.
3. **Automigrate** : Synchronise le schéma de la base de données (incluant les nouvelles tables de Chat).
4. **Autoseed** : Injecte automatiquement des données de test (Ports, Terminaux, Transporteurs, Slots) pour que vous puissiez tester immédiatement.
5. **Runtime Support** : Configure `tsconfig-paths` pour supporter les imports absolus en production.

---

## 📚 Points d'accès API
- **Swagger UI (Documentation Interactive)** : `http://localhost:3000/docs`
- **Port d'écoute API** : `3000`
- **Socket Gateway** : `ws://localhost:3000`

---

## 🛠️ Tests & Démonstration
Pour vérifier que tout fonctionne, utilisez nos scripts de démonstration ou notre suite de vérification automatisée :

### 1. Suite de Vérification Automatisée (Recommandé)
Ce script réinitialise la base de données, injecte les données de test, redémarre les services et valide l'intégralité du flux métier (IA, Blockchain, Audit).
```bash
.\scripts\verify-project.bat
```

### 2. Démo du flux métier seul
```bash
node scripts/demo.js
```

---

## 🏆 Équipe & Contexte
Développé dans le cadre du **MicroHack 3**. 
**Objectif** : Moderniser la logistique portuaire algérienne par l'innovation technologique.

---
*Fiable. Immuable. Temps-Réel. Bienvenue dans le futur de la logistique.*
