# Guide Frontend Developer - VoteBGDE

Ce document sert de reference front pour integrer l'API VoteBGDE (parcours etudiant + dashboard admin), avec les acces, endpoints, formats et erreurs principales.

## 1) URLs et environnements

- API VoteBGDE (local): `http://localhost:3000/api`
- API UCAO (consommee par VoteBGDE): `http://localhost:4000/api`
- Frontend Vite (local): `http://localhost:5173`

Variable frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

## 2) Authentification admin

### Login
- `POST /auth/login`
- Body:
```json
{ "email": "admin@ucao-uut.tg", "password": "<mot-de-passe-clair>" }
```
- Reponse utile:
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "admin": {
      "id": "...",
      "email": "...",
      "role": "SUPER_ADMIN",
      "permissions": ["scrutin:read", "scrutin:write", "candidate-list:write", "results:publish", "dashboard:read"]
    }
  }
}
```

### Header pour routes protegees
```http
Authorization: Bearer <accessToken>
```

### Refresh / Logout
- `POST /auth/refresh`
- `POST /auth/logout`

## 3) Parcours etudiant (vote)

Ordre obligatoire des appels:

1. `GET /scrutin/active`
2. `POST /otp/send`
3. `POST /otp/verify`
4. `POST /vote`

### 3.1 Recuperer scrutin actif
- `GET /scrutin/active`
- Reponse contient `candidateLists[]` (id, name, slogan, order)

### 3.2 Envoi OTP
- `POST /otp/send`
- Body:
```json
{ "matricule": "UCAODEMO001", "email": "user@example.com" }
```
- Reponse:
```json
{
  "success": true,
  "data": {
    "sessionToken": "...",
    "expiresInMinutes": 10,
    "email": "m******@...",
    "debugOtp": "123456"
  }
}
```

Note dev: `debugOtp` n'est present qu'en mode local quand `MAIL_TRANSPORT=json`.

### 3.3 Verification OTP
- `POST /otp/verify`
- Body:
```json
{ "sessionToken": "...", "otp": "123456" }
```

### 3.4 Vote
- `POST /vote`
- Body:
```json
{ "sessionToken": "...", "candidateListId": "<id-liste>" }
```

## 4) Dashboard admin (CRUD principal)

### Dashboard/KPI
- `GET /admin/dashboard`

### Scrutins
- `GET /admin/scrutins`
- `POST /admin/scrutins`
- `PATCH /admin/scrutins/:id`
- `DELETE /admin/scrutins/:id` (archive)
- `POST /admin/scrutins/:id/publish-results`
- `GET /admin/scrutins/:id/participation`
- `GET /admin/scrutins/:id/results`

### Listes candidates
- `POST /admin/candidate-lists`
- `GET /admin/candidate-lists/scrutin/:scrutinId`
- `PATCH /admin/candidate-lists/:id`
- `DELETE /admin/candidate-lists/:id`

## 5) Permissions utiles cote UI

Permissions exposees dans le token admin:

- `scrutin:read`
- `scrutin:write`
- `candidate-list:read`
- `candidate-list:write`
- `results:publish`
- `dashboard:read`
- `audit:read`

Recommandation UI:
- masquer/desactiver les actions non autorisees selon `admin.permissions`.

## 6) Erreurs frequentes a gerer cote frontend

### OTP
- `404`: etudiant introuvable/non autorise
- `409`: deja vote
- `410`: session OTP expiree
- `423`: trop de tentatives OTP
- `429`: limite de requetes depassee

### Vote
- `400`: payload invalide ou liste invalide pour le scrutin
- `401`: session OTP non verifiee
- `404`: session OTP ou liste introuvable
- `409`: etudiant deja vote

### Admin
- `401`: token manquant/invalide
- `403`: permission insuffisante

## 7) Access/dev requis

Le frontend dev a besoin de:

1. URL API (`VITE_API_URL`)
2. Un compte admin valide (email + mot de passe clair)
3. CORS ouvert pour `http://localhost:5173`
4. Donnees seed de demo (scrutin ouvert + listes candidates)

## 8) Checklist integration frontend

- [ ] login admin + stockage accessToken
- [ ] injection Bearer token sur endpoints admin
- [ ] affichage des listes depuis `scrutin/active`
- [ ] flow OTP complet (send -> verify -> vote)
- [ ] gestion UX des erreurs backend (messages lisibles)
- [ ] gestion expiration token/session

## 9) Commandes utiles

```bash
# vote api
npm run dev

# frontend
cd frontend && npm run dev

# reset demo vote state
npm run load:demo:reset

# campagne otp/verify
npm run load:otp-verify
```
