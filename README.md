# VoteGBDE Backend API

Backend de vote numerique pour le BGDE UCAO-UUT, construit avec Node.js, Express, TypeScript et Prisma.

## Stack

- Node.js + Express
- TypeScript
- PostgreSQL + Prisma
- JWT (access + refresh)
- Zod (validation)
- Swagger/OpenAPI
- Pino (logging)

## Architecture

Le projet suit une Clean Architecture modulaire:

- `src/modules/auth` : securite centralisee (login, refresh, logout, guards JWT, roles, permissions)
- `src/modules/otp` : envoi et verification OTP
- `src/modules/votes` : soumission du vote anonyme
- `src/modules/scrutins` : gestion et consultation des scrutins + stats/resultats
- `src/modules/candidate-lists` : gestion des listes candidates
- `src/modules/health` : healthcheck
- `src/shared` : middlewares/utilitaires/erreurs communs
- `src/infrastructure` : prisma, mail, logger

## Installation

```bash
npm install
cp .env.example .env
```

Configurer ensuite les variables dans `.env`.

Variables d'integration API universitaire (obligatoires):

- `UCAO_API_BASE_URL`
- `UCAO_API_KEY`
- `UCAO_API_TIMEOUT_MS`

## Commandes principales

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Documentation API

- Swagger: `http://localhost:3000/api/docs`

## Integration avec UCAO University API

VoteBGDE ne verifie plus le matricule localement. Le service OTP appelle:

- `GET /api/students/verify/:matricule` sur `ucao-university-api`

Pre-requis:

- lancer `ucao-university-api` sur `http://localhost:4000`
- configurer `UCAO_API_BASE_URL`, `UCAO_API_KEY`, `UCAO_API_TIMEOUT_MS` dans `.env`

Validation inter-services:

```bash
npm run test:inter-api -- http://localhost:3000 http://localhost:4000
```

## Tests

```bash
npm test
npm run test:e2e -- http://localhost:3000
npm run test:e2e:security -- http://localhost:3000
npm run pre-release
```

## Authentification admin

Endpoints principaux:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Compatibilite legacy:

- `POST /api/admin/login` (alias de login)

## Notes de securite

- vote stocke de maniere anonyme
- anti double-vote transactionnel
- OTP hashe et expire
- publication des resultats controlee
- routes admin protegees par JWT + permissions
- verification matricule realisee via appel HTTP a `ucao-university-api`
