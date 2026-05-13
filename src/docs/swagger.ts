import type { OpenAPIV3_1 } from "openapi-types";

export const swaggerDocument: OpenAPIV3_1.Document = {
  openapi: "3.1.0",
  info: {
    title: "UCAO-UUT BGDE Voting API",
    version: "1.0.0",
    description: "API backend du systeme de vote numerique BGDE.",
  },
  servers: [{ url: "http://localhost:3000/api", description: "Local development server" }],
  tags: [
    { name: "Health", description: "Etat de sante du backend" },
    { name: "Auth", description: "Authentification, tokens et autorisations" },
    { name: "OTP", description: "Generation et verification OTP" },
    { name: "Vote", description: "Soumission du vote anonyme" },
    { name: "Scrutin", description: "Consultation du scrutin actif" },
    { name: "Admin", description: "Gestion admin" },
  ],
  paths: {
    "/health": { get: { tags: ["Health"], summary: "Health check", responses: { "200": { description: "OK" } } } },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Connexion admin (etape 1)",
        description:
          "Valide email et mot de passe, envoie un code OTP a l adresse de l administrateur. Ne retourne pas encore les tokens.",
        responses: {
          "200": { description: "OTP envoye (otpRequired: true, otpSessionToken)" },
          "401": { description: "Identifiants invalides" },
        },
      },
    },
    "/auth/login/verify": {
      post: {
        tags: ["Auth"],
        summary: "Connexion admin (etape 2 — OTP)",
        description: "Echange otpSessionToken + code OTP contre access et refresh tokens.",
        responses: {
          "200": { description: "Tokens emis" },
          "401": { description: "OTP invalide" },
          "404": { description: "Session OTP introuvable" },
          "410": { description: "OTP expire" },
          "423": { description: "Trop de tentatives" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rafraichir les tokens",
        description: "Invalide l'ancien refresh token et retourne une nouvelle paire.",
        responses: { "200": { description: "Tokens rafraichis" }, "401": { description: "Refresh token invalide" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Deconnexion",
        description: "Revoque le refresh token courant.",
        responses: { "200": { description: "Deconnexion OK" }, "401": { description: "Refresh token invalide" } },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Auth"],
        summary: "Connexion admin (compatibilite)",
        description: "Alias de /auth/login (etape 1 — envoi OTP).",
        responses: { "200": { description: "OTP envoye" }, "401": { description: "Identifiants invalides" } },
      },
    },

    "/otp/send": { post: { tags: ["OTP"], summary: "Envoyer OTP", responses: { "200": { description: "OTP envoye" } } } },
    "/otp/verify": { post: { tags: ["OTP"], summary: "Verifier OTP", responses: { "200": { description: "OTP verifie" } } } },
    "/vote": { post: { tags: ["Vote"], summary: "Soumettre vote", responses: { "200": { description: "Vote enregistre" } } } },

    "/scrutin/active": {
      get: {
        tags: ["Scrutin"],
        summary: "Recuperer le scrutin actif",
        responses: { "200": { description: "Scrutin actif" }, "404": { description: "Aucun scrutin actif" } },
      },
    },
    "/scrutin/{id}/results": {
      get: {
        tags: ["Scrutin"],
        summary: "Resultats publics d'un scrutin",
        responses: {
          "200": { description: "Resultats publies" },
          "403": { description: "Resultats non publies" },
          "404": { description: "Scrutin introuvable" },
        },
      },
    },

    "/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard admin global",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "KPIs globaux" }, "403": { description: "Permissions insuffisantes" } },
      },
    },
    "/admin/scrutins": {
      get: { tags: ["Admin"], summary: "Lister scrutins", security: [{ bearerAuth: [] }], responses: { "200": { description: "Liste" } } },
      post: { tags: ["Admin"], summary: "Creer scrutin", security: [{ bearerAuth: [] }], responses: { "201": { description: "Cree" }, "409": { description: "Un autre scrutin OPEN existe deja" } } },
    },
    "/admin/scrutins/{id}": {
      patch: { tags: ["Admin"], summary: "Mettre a jour scrutin", security: [{ bearerAuth: [] }], responses: { "200": { description: "Mis a jour" } } },
      delete: { tags: ["Admin"], summary: "Archiver scrutin", security: [{ bearerAuth: [] }], responses: { "200": { description: "Archive" } } },
    },
    "/admin/scrutins/{id}/publish-results": {
      post: {
        tags: ["Admin"],
        summary: "Publier officiellement les resultats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Resultats publies" }, "403": { description: "Scrutin pas encore cloture" } },
      },
    },
    "/admin/scrutins/{id}/participation": {
      get: {
        tags: ["Admin"],
        summary: "Statistiques de participation",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Statistiques calculees" } },
      },
    },
    "/admin/scrutins/{id}/results": {
      get: {
        tags: ["Admin"],
        summary: "Resultats agreges par liste",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Resultats calcules" }, "403": { description: "Disponible apres cloture uniquement" } },
      },
    },
    "/admin/candidate-lists": {
      post: { tags: ["Admin"], summary: "Creer liste candidate", security: [{ bearerAuth: [] }], responses: { "201": { description: "Creee" } } },
    },
    "/admin/candidate-lists/scrutin/{scrutinId}": {
      get: { tags: ["Admin"], summary: "Lister listes d'un scrutin", security: [{ bearerAuth: [] }], responses: { "200": { description: "Liste" } } },
    },
    "/admin/candidate-lists/{id}": {
      patch: { tags: ["Admin"], summary: "Mettre a jour liste candidate", security: [{ bearerAuth: [] }], responses: { "200": { description: "Mise a jour" } } },
      delete: { tags: ["Admin"], summary: "Desactiver liste candidate", security: [{ bearerAuth: [] }], responses: { "200": { description: "Desactivee" } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};
