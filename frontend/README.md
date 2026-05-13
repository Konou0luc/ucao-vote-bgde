# VoteBGDE Frontend Test App

Frontend React pour tester rapidement le flow public de l'API VoteBGDE.

## Fonctions

- Lecture du scrutin actif (`GET /scrutin/active`)
- Envoi OTP (`POST /otp/send`)
- Verification OTP (`POST /otp/verify`)
- Soumission du vote (`POST /vote`)
- Journal visuel des reponses API

## Configuration

```bash
cp .env.example .env
```

Variable principale:

- `VITE_API_URL` (par defaut: `http://localhost:3000/api`)

## Lancement

```bash
npm install
npm run dev
```

Application disponible sur le port Vite affiche dans le terminal (souvent `http://localhost:5173`).
