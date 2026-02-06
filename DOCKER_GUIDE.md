# 🐳 Guide de Dockerisation : Smart Port Hub

Ce document explique comment nous avons conteneurisé l'ensemble de la plateforme pour garantir un déploiement fiable et reproductible, peu importe la machine (Windows, Mac ou Linux).

---

## 🏗️ 1. Architecture Multi-Conteneurs

Nous utilisons **Docker Compose** pour orchestrer trois services qui communiquent entre eux dans un réseau privé virtuel :

1.  **`postgres`** : La base de données (image légère Alpine).
2.  **`backend`** : L'API NestJS (Node.js).
3.  **`ai-service`** : Le microservice d'IA (Python/FastAPI).

---

## 📄 2. Le Backend NestJS (`Dockerfile` à la racine)

Nous avons utilisé un **"Multi-Stage Build"** (construction en plusieurs étapes) :

*   **Étape 1 (Builder)** : Utilise une image Node complète pour compiler le TypeScript en JavaScript (`npm run build`) et générer le client Prisma.
*   **Étape 2 (Production)** : On ne garde que les fichiers compilés (`dist/`) et les `node_modules`.
*   **Pourquoi ?** Cela permet d'avoir une image finale beaucoup plus petite et sécurisée (pas de code source, pas d'outils de compilation).

---

## 📄 3. Le Service IA (`src/modules/ai_service/Dockerfile`)

C'est ici que Docker nous a sauvé !
*   **Le problème** : Installer certaines bibliothèques comme `scikit-learn` sur Windows peut échouer à cause des outils de compilation C++.
*   **La solution Docker** : On utilise une image **Linux (Python-slim)**. Docker installe les dépendances à l'intérieur de ce système Linux propre, ce qui garantit que l'IA fonctionne instantanément chez n'importe qui.
*   **Installation** : On installe `build-essential` temporairement pour compiler les libs Python, puis on nettoie pour rester léger.

---

## ⚙️ 4. Orchestration (`docker-compose.yml`)

Le fichier `docker-compose.yml` est le chef d'orchestre :

### A. Réseautage & Communication
Les services se parlent par leurs noms de domaine internes :
*   Le Backend contacte l'IA via `http://ai-service:8000`.
*   L'IA contacte le Backend via `http://backend:3000/api`.

### B. Automatisation au démarrage
Pour le service `backend`, nous avons automatisé trois étapes critiques dans la commande de lancement :
1.  `npx prisma db push` : Synchronise le schéma avec la base Postgres.
2.  `npx prisma db seed` : Remplit la base avec les données de test (Ports, Terminaux).
3.  `node dist/main.js` : Lance l'application.

### C. Persistance des données
Nous utilisons un **Volume** (`postgres_data`) pour que, même si tu éteins tout, les données de ta base de données ne soient pas perdues.

---

## 🛠️ 5. Résumé des avantages pour le JURY

*   **Portabilité** : "Une seule commande (`docker compose up`) configure TOUT le système."
*   **Isolation** : "L'IA en Python n'interfère pas avec le Backend en Node.js."
*   **Production-Ready** : "Nos images sont optimisées (Multi-stage) et prêtes à être déployées sur un serveur cloud."
*   **Fiabilité** : "Le processus de migration et de seeding est automatique, évitant les erreurs humaines de configuration."

---
*Ce système permet de passer d'un code local à une application distribuée capable de tourner n'importe où.*
