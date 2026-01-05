# 🏦 AVENIR Bank - Application Bancaire Web

> **Alliance de Valeurs Économiques et Nationales Investies Responsablement**

Application bancaire web moderne développée en TypeScript, suivant les principes de Clean Architecture, CQRS et Event Sourcing.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Contraintes Techniques](#-contraintes-techniques)

---

## ✨ Fonctionnalités

### 👤 Client

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Inscription** | Inscription avec confirmation par email | ✅ |
| **Authentification** | Connexion sécurisée avec JWT | ✅ |
| **Comptes Multiples** | CHECKING, SAVINGS, INVESTMENT | ✅ |
| **IBAN Valide** | Génération d'IBAN FR valide (Modulo 97) | ✅ |
| **Transferts** | Virements internes (au sein d'AVENIR) | ✅ |
| **Épargne** | Compte rémunéré quotidiennement | ✅ |
| **Investissement** | Achat/Vente d'actions avec carnet d'ordres | ✅ |

### 👔 Directeur de Banque (ADMIN)

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Gestion Comptes** | Créer, modifier, supprimer, bannir | ✅ |
| **Taux d'Épargne** | Modification avec notification temps réel | ✅ |
| **Actions** | Créer, modifier disponibilité, supprimer | ✅ |
| **Cours Actions** | Calculé par l'offre/demande (non modifiable) | ✅ |

### 🧑‍💼 Conseiller Bancaire (MANAGER)

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| **Crédits** | Octroi avec mensualité constante | ✅ |
| **Assurance** | Taux sur capital total | ✅ |
| **Chat** | Messagerie temps réel WebSocket | ✅ |
| **Transfert Discussion** | Entre conseillers | ✅ |

---

## 🏗️ Architecture

### Clean Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Controllers │  │  WebSocket  │  │     SSE     │              │
│  │   (HTTP)    │  │   Gateway   │  │  Controller │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                       Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Commands   │  │   Queries   │  │   Events    │              │
│  │  Handlers   │  │  Handlers   │  │  Handlers   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                         CQRS + Event Sourcing                    │
├─────────────────────────────────────────────────────────────────┤
│                         Domain Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Aggregates  │  │   Value     │  │   Domain    │              │
│  │             │  │   Objects   │  │   Services  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                      Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Prisma    │  │  In-Memory  │  │    Event    │              │
│  │    (SQL)    │  │    Repos    │  │    Store    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Structure des Fichiers

```
src/
├── domain/                    # Couche Métier (Entités, Value Objects)
│   ├── entities/              # Aggregates (User, BankAccount, Order, Loan)
│   ├── value-objects/         # IBAN, Money
│   ├── services/              # Order Matching Engine
│   ├── repositories/          # Interfaces des repositories
│   └── types/                 # Types et enums
│
├── application/               # Couche Application (Use Cases)
│   ├── commands/              # Commands CQRS
│   ├── queries/               # Queries CQRS
│   ├── use-cases/             # Command/Query Handlers
│   ├── event-handlers/        # Projectors
│   ├── services/              # Services applicatifs
│   └── dto/                   # Data Transfer Objects
│
├── infrastructure/            # Couche Infrastructure
│   ├── database/prisma/       # Prisma (PostgreSQL)
│   ├── repositories/          # Implémentations
│   │   ├── prisma/            # Adaptateur SQL
│   │   └── in-memory/         # Adaptateur In-Memory
│   ├── event-store/           # Event Store
│   ├── auth/                  # JWT, Guards, Strategies
│   └── services/              # Email, etc.
│
├── interface/                 # Couche Interface
│   ├── http/controllers/      # REST Controllers (NestJS)
│   ├── websocket/             # Chat Gateway
│   ├── sse/                   # Server-Sent Events
│   └── presenters/            # Response formatters
│
└── express/                   # Framework alternatif Express
    ├── routes/                # Express routes
    ├── middleware/            # Auth, Error handling
    └── server-express.ts      # Express server
```

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** >= 9.x

### Étapes

```bash
# 1. Cloner le repository
git clone <repository-url>
cd "version 0"

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Configurer la base de données
# Éditer .env avec vos paramètres PostgreSQL

# 5. Générer le client Prisma
npx prisma generate

# 6. Exécuter les migrations
npx prisma migrate deploy

# 7. (Optionnel) Seed data
npx prisma db seed
```

---

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/avenir_bank?schema=public"

# JWT
JWT_SECRET="votre-secret-jwt-super-securise-256-bits-minimum"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
EXPRESS_PORT=3001

# Email (Nodemailer)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
EMAIL_FROM="noreply@avenir-bank.fr"

# Frontend URL (for email confirmation links)
FRONTEND_URL="http://localhost:3000"
```

---

## 🎯 Démarrage

### Mode Développement

```bash
# NestJS (port 3000)
npm run start:dev

# Express (port 3001)
npm run express:dev

# Les deux frameworks simultanément
npm run start:both
```

### Mode Production

```bash
# Build
npm run build

# NestJS
npm run start:prod

# Express
npm run express:start
```

---

## 📚 API Documentation

### Base URLs

| Framework | URL | Port |
|-----------|-----|------|
| NestJS | http://localhost:3000 | 3000 |
| Express | http://localhost:3001/api | 3001 |

### Authentification

Toutes les routes protégées nécessitent un header JWT:
```
Authorization: Bearer <token>
```

### Endpoints Principaux

#### 🔐 Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Inscription | ❌ |
| GET | `/auth/confirm/:token` | Confirmation email | ❌ |
| POST | `/auth/login` | Connexion | ❌ |

#### 💳 Accounts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/accounts/open` | Ouvrir un compte | ✅ |
| GET | `/accounts/:id` | Détails compte | ✅ |
| GET | `/accounts/user/:userId` | Comptes d'un user | ✅ |
| POST | `/accounts/transfer` | Virement interne | ✅ |
| PUT | `/accounts/:id/rename` | Renommer | ✅ |
| DELETE | `/accounts/:id` | Supprimer | ✅ |
| POST | `/accounts/interest/calculate` | Calcul intérêts | ✅ |

#### 📈 Orders (Investissement)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/orders` | Passer un ordre | ✅ |
| GET | `/orders/:id` | Détails ordre | ✅ |
| GET | `/orders/user/:userId` | Ordres d'un user | ✅ |
| GET | `/orders/security/:id/book` | Carnet d'ordres | ✅ |
| DELETE | `/orders/:id` | Annuler ordre | ✅ |

#### 💰 Loans

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/loans/grant` | Octroyer crédit | ✅ | MANAGER |
| GET | `/loans/:id` | Détails crédit | ✅ | - |
| GET | `/loans/:id/schedule` | Échéancier | ✅ | - |
| GET | `/loans/user/:userId` | Crédits d'un user | ✅ | - |

#### 👑 Admin

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/admin/stocks` | Créer action | ✅ | ADMIN |
| PUT | `/admin/stocks/:symbol/availability` | Disponibilité | ✅ | ADMIN |
| DELETE | `/admin/stocks/:symbol` | Supprimer | ✅ | ADMIN |
| POST | `/admin/savings-rate` | Modifier taux | ✅ | ADMIN |
| GET | `/admin/users` | Liste users | ✅ | ADMIN/MANAGER |
| PUT | `/admin/users/:id/role` | Modifier rôle | ✅ | ADMIN |
| PUT | `/admin/accounts/:id/ban` | Bannir compte | ✅ | ADMIN |

#### 💬 Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/messages/conversations` | Conversations | ✅ |
| GET | `/messages/conversations/:id` | Messages | ✅ |
| GET | `/messages/unread` | Non lus | ✅ |

#### 🔔 Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | Liste notifications | ✅ |
| POST | `/notifications/:id/read` | Marquer lue | ✅ |
| POST | `/notifications/read-all` | Tout marquer lu | ✅ |
| GET | `/notifications/unread-count` | Compteur | ✅ |

### WebSocket Events (Chat)

Namespace: `/chat`

| Event | Direction | Description |
|-------|-----------|-------------|
| `private_message` | Client → Server | Envoyer message |
| `request_help` | Client → Server | Demander aide |
| `accept_help` | Advisor → Server | Accepter demande |
| `transfer_conversation` | Advisor → Server | Transférer conversation |
| `mark_read` | Client → Server | Marquer lu |
| `new_message` | Server → Client | Nouveau message |
| `help_request_broadcast` | Server → Advisors | Diffusion demande |
| `advisor_assigned` | Server → Client | Conseiller assigné |

---

## 🧪 Tests

### Exécuter les Tests

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Tous les tests
npm run test

# Couverture
npm run test:cov
```

### Structure des Tests

```
test/
├── unit/                      # Tests unitaires
│   ├── repository.spec.ts     # In-Memory repositories
│   ├── chat-transfer.spec.ts  # Chat transfer logic
│   ├── confirm-email.handler.spec.ts
│   └── email.service.spec.ts
│
├── api.e2e-spec.ts           # Tests E2E complets
├── app.e2e-spec.ts           # Tests application
└── new-features.e2e-spec.ts  # Tests nouvelles features
```

---

## ⚡ Contraintes Techniques Respectées

### 1. Langage TypeScript ✅

Backend entièrement en TypeScript avec typage strict.

### 2. Clean Architecture ✅

| Couche | Responsabilité |
|--------|----------------|
| **Domain** | Entités, Value Objects, Services métier |
| **Application** | Use Cases, Commands, Queries, Event Handlers |
| **Interface** | Controllers HTTP, WebSocket, SSE |
| **Infrastructure** | Database, Event Store, External Services |

### 3. 2 Adaptateurs Base de Données ✅

- **Prisma (PostgreSQL)** : Production
- **In-Memory** : Tests unitaires

### 4. 2 Frameworks Backend ✅

- **NestJS** : Port 3000
- **Express** : Port 3001

### Bonus Implémentés

#### CQRS ✅

```typescript
// Commands
RegisterUserCommand, OpenAccountCommand, PlaceOrderCommand...

// Queries  
LoginQuery, GetAccountsQuery...
```

#### Event Sourcing ✅

```typescript
// Events persistés
UserRegisteredEvent, AccountOpenedEvent, FundsDepositedEvent,
TransferSentEvent, OrderPlacedEvent, LoanGrantedEvent...

// Event Store
aggregate_id, aggregate_type, version, type, payload, created_at
```

---

## 🔧 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run start:dev` | NestJS mode dev |
| `npm run express:dev` | Express mode dev |
| `npm run start:both` | Les deux frameworks |
| `npm run build` | Build production |
| `npm run test` | Tous les tests |
| `npm run test:unit` | Tests unitaires |
| `npm run test:e2e` | Tests E2E |
| `npm run test:cov` | Couverture |
| `npm run lint` | Lint code |
| `npm run format` | Format code |

---

## 📝 Calculs Métier

### IBAN (ISO 13616)

```
Format: FRkk BBBBB GGGGG CCCCCCCCCCC KK
- FR: Code pays
- kk: Clé de contrôle (Modulo 97)
- BBBBB: Code banque (12345)
- GGGGG: Code guichet (67890)
- CCCCCCCCCCC: Numéro de compte (11 chiffres)
- KK: Clé RIB
```

### Crédit (Mensualité Constante)

```
M = P × [r(1+r)^n] / [(1+r)^n - 1]

Où:
- M = Mensualité
- P = Principal
- r = Taux mensuel (taux annuel / 12)
- n = Nombre de mensualités

Assurance = (Principal × Taux assurance) / n
Mensualité totale = M + Assurance
```

### Intérêts Épargne

```
Intérêt journalier = Solde × (Taux annuel / 365)
```

### Prix Actions

Calculé par l'Order Matching Engine basé sur l'équilibre offre/demande.
Frais: 1€ par transaction (achat ou vente).

---

## 📄 Licence

Ce projet est développé dans un cadre académique.

---

## 👥 Auteurs

Développé pour le cours de développement web.

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/)
- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Socket.IO](https://socket.io/)
