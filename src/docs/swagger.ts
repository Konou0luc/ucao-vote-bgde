import type { OpenAPIV3_1 } from "openapi-types";

export const swaggerDocument: OpenAPIV3_1.Document = {
  openapi: "3.1.0",
  info: {
    title: "UCAO-UUT BGDE Voting API",
    version: "1.0.0",
    description: "API backend du systeme de vote numerique BGDE.",
  },
  servers: [
    { url: "http://localhost:3000/api", description: "Local development server" },
    { url: "https://ucao-vote-bgde.vercel.app/api", description: "Production server" },
  ],
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP envoye (otpRequired: true, otpSessionToken)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminLoginPendingOtpResponse" },
              },
            },
          },
          "401": { description: "Identifiants invalides" },
        },
      },
    },
    "/auth/login/verify": {
      post: {
        tags: ["Auth"],
        summary: "Connexion admin (etape 2 — OTP)",
        description: "Echange otpSessionToken + code OTP contre access et refresh tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyLoginOtpInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens emis",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens rafraichis",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": { description: "Refresh token invalide" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Deconnexion",
        description: "Revoque le refresh token courant.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Deconnexion OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BasicResponse" },
              },
            },
          },
          "401": { description: "Refresh token invalide" },
        },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Auth"],
        summary: "Connexion admin (compatibilite)",
        description: "Alias de /auth/login (etape 1 — envoi OTP).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP envoye",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminLoginPendingOtpResponse" },
              },
            },
          },
          "401": { description: "Identifiants invalides" },
        },
      },
    },

    "/otp/send": {
      post: {
        tags: ["OTP"],
        summary: "Envoyer OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP envoye",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SendOtpResponse" },
              },
            },
          },
        },
      },
    },
    "/otp/verify": {
      post: {
        tags: ["OTP"],
        summary: "Verifier OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verifie",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VerifyOtpResponse" },
              },
            },
          },
        },
      },
    },
    "/vote": {
      post: {
        tags: ["Vote"],
        summary: "Soumettre vote",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CastVoteInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Vote enregistre",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CastVoteResponse" },
              },
            },
          },
        },
      },
    },

    "/scrutin/active": {
      get: {
        tags: ["Scrutin"],
        summary: "Recuperer le scrutin actif",
        responses: {
          "200": {
            description: "Scrutin actif",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ActiveScrutinResponse" },
              },
            },
          },
          "404": { description: "Aucun scrutin actif" },
        },
      },
    },
    "/scrutin/{id}/results": {
      get: {
        tags: ["Scrutin"],
        summary: "Recuperer les resultats d un scrutin",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Resultats du scrutin" },
        },
      },
    },

    "/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard admin global",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "KPIs globaux",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardResponse" },
              },
            },
          },
          "403": { description: "Permissions insuffisantes" },
        },
      },
    },
    "/admin/scrutins": {
      get: {
        tags: ["Admin"],
        summary: "Lister scrutins",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Liste",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Scrutin" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Creer scrutin",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateScrutinInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Cree",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Scrutin" },
                  },
                },
              },
            },
          },
          "409": { description: "Un autre scrutin OPEN existe deja" },
        },
      },
    },
    "/admin/scrutins/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Mettre a jour scrutin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateScrutinInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Mis a jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Scrutin" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Archiver scrutin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Archive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Scrutin" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/scrutins/{id}/publish-results": {
      post: {
        tags: ["Admin"],
        summary: "Publier officiellement les resultats",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Resultats publies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Scrutin" },
                  },
                },
              },
            },
          },
          "403": { description: "Scrutin pas encore cloture" },
        },
      },
    },
    "/admin/scrutins/{id}/participation": {
      get: {
        tags: ["Admin"],
        summary: "Statistiques de participation",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Statistiques calculees",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ParticipationStatsResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/scrutins/{id}/results": {
      get: {
        tags: ["Admin"],
        summary: "Resultats agreges par liste",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Resultats calcules",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScrutinResultsResponse" },
              },
            },
          },
          "403": { description: "Disponible apres cloture uniquement" },
        },
      },
    },
    "/admin/candidate-lists": {
      post: {
        tags: ["Admin"],
        summary: "Creer liste candidate",
        description: "Permet de creer une liste avec ses membres, sa vision et sa video (upload via multipart/form-data).",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["scrutinId", "name", "order"],
                properties: {
                  scrutinId: { type: "string" },
                  name: { type: "string" },
                  slogan: { type: "string" },
                  description: { type: "string", description: "Vision globale de la liste" },
                  members: {
                    type: "string",
                    description: "JSON stringified array of {name, role}",
                  },
                  actionPlan: {
                    type: "string",
                    description: "JSON stringified array of strings (Vision / Plan d'action)",
                  },
                  video: {
                    type: "string",
                    format: "binary",
                    description: "Fichier video (mp4, webm, mov)",
                  },
                  order: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Creee",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/CandidateList" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/candidate-lists/scrutin/{scrutinId}": {
      get: {
        tags: ["Admin"],
        summary: "Lister listes d'un scrutin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "scrutinId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Liste",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/CandidateList" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/candidate-lists/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Mettre a jour liste candidate",
        description: "Mise a jour partielle (multipart/form-data pour la video).",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  slogan: { type: "string" },
                  description: { type: "string", description: "Vision globale" },
                  members: {
                    type: "string",
                    description: "JSON stringified array",
                  },
                  actionPlan: {
                    type: "string",
                    description: "JSON stringified array (Vision)",
                  },
                  video: {
                    type: "string",
                    format: "binary",
                  },
                  order: { type: "integer" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Mise a jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/CandidateList" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Desactiver liste candidate",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Desactivee",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/CandidateList" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Changer le mot de passe",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Mot de passe modifie" },
          "401": { description: "Mot de passe actuel incorrect" },
        },
      },
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
    schemas: {
      BasicResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation reussie" },
          data: { type: "object", example: {} },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      VerifyLoginOtpInput: {
        type: "object",
        required: ["otpSessionToken", "otp"],
        properties: {
          otpSessionToken: { type: "string" },
          otp: { type: "string", pattern: "^\\d{6}$" },
        },
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      LogoutInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      AdminLoginPendingOtpResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              otpRequired: { type: "boolean" },
              otpSessionToken: { type: "string" },
              expiresInMinutes: { type: "number" },
              emailMasked: { type: "string" },
              debugOtp: { type: "string", description: "Uniquement en dev/test avec MAIL_TRANSPORT=json" },
            },
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Connexion reussie" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
              refreshToken: { type: "string", example: "def456..." },
              tokenType: { type: "string", example: "Bearer" },
              expiresIn: { type: "string", example: "15m" },
              admin: {
                type: "object",
                properties: {
                  id: { type: "string", example: "clwh2u3y8000008l2..." },
                  email: { type: "string", example: "admin@ucao-uut.tg" },
                  role: { type: "string", example: "SUPER_ADMIN" },
                  permissions: {
                    type: "array",
                    items: { type: "string" },
                    example: ["scrutin:read", "scrutin:write", "dashboard:read"],
                  },
                },
              },
            },
          },
        },
      },
      SendOtpInput: {
        type: "object",
        required: ["matricule", "email"],
        properties: {
          matricule: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      SendOtpResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              sessionToken: { type: "string" },
              expiresInMinutes: { type: "number" },
              email: { type: "string" },
              debugOtp: { type: "string", description: "Uniquement en dev/test avec MAIL_TRANSPORT=json" },
            },
          },
        },
      },
      VerifyOtpInput: {
        type: "object",
        required: ["sessionToken", "otp"],
        properties: {
          sessionToken: { type: "string" },
          otp: { type: "string", pattern: "^\\d{6}$" },
        },
      },
      VerifyOtpResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              otpVerified: { type: "boolean" },
              sessionToken: { type: "string" },
              participationReady: { type: "boolean" },
            },
          },
        },
      },
      CastVoteInput: {
        type: "object",
        required: ["sessionToken", "candidateListId"],
        properties: {
          sessionToken: { type: "string" },
          candidateListId: { type: "string" },
        },
      },
      CastVoteResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              voted: { type: "boolean" },
              voteId: { type: "string" },
              auditHash: { type: "string" },
              castAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      Scrutin: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: ["string", "null"] },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          status: { type: "string" },
          resultsPublishedAt: { type: ["string", "null"], format: "date-time" },
          candidateLists: {
            type: "array",
            items: { $ref: "#/components/schemas/CandidateList" },
          },
        },
      },
      CreateScrutinInput: {
        type: "object",
        required: ["title", "startsAt", "endsAt"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 180, example: "Elections Bureau des Etudiants 2026" },
          description: { type: "string", maxLength: 1500, example: "Scrutin annuel pour le renouvellement du bureau." },
          startsAt: { type: "string", format: "date-time", example: "2026-06-01T08:00:00.000Z" },
          endsAt: { type: "string", format: "date-time", example: "2026-06-01T18:00:00.000Z" },
          status: {
            type: "string",
            enum: ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "ARCHIVED"],
            default: "DRAFT",
            example: "DRAFT",
          },
        },
      },
      UpdateScrutinInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 180, example: "Elections BDE 2026 (MAJ)" },
          description: { type: "string", maxLength: 1500, example: "Mise a jour de la description." },
          startsAt: { type: "string", format: "date-time", example: "2026-06-02T08:00:00.000Z" },
          endsAt: { type: "string", format: "date-time", example: "2026-06-02T18:00:00.000Z" },
          status: { type: "string", enum: ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "ARCHIVED"], example: "SCHEDULED" },
        },
      },
      ActiveScrutinResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: ["string", "null"] },
              startsAt: { type: "string", format: "date-time" },
              endsAt: { type: "string", format: "date-time" },
              status: { type: "string" },
              candidateLists: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    slogan: { type: ["string", "null"] },
                    description: { type: ["string", "null"] },
                    members: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CandidateListMember" },
                    },
                    actionPlan: {
                      type: "array",
                      items: { type: "string" },
                    },
                    videoUrl: { type: ["string", "null"], format: "uri" },
                    order: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
      DashboardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              students: {
                type: "object",
                properties: { eligible: { type: "number" } },
              },
              votes: {
                type: "object",
                properties: { total: { type: "number" } },
              },
              scrutins: {
                type: "object",
                properties: {
                  draft: { type: "number" },
                  scheduled: { type: "number" },
                  open: { type: "number" },
                  closed: { type: "number" },
                  archived: { type: "number" },
                },
              },
            },
          },
        },
      },
      ParticipationStatsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              scrutinId: { type: "string" },
              title: { type: "string" },
              status: { type: "string" },
              eligibleStudents: { type: "number" },
              participants: { type: "number" },
              voters: { type: "number" },
              participationRate: { type: "number" },
            },
          },
        },
      },
      ScrutinResultsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              scrutinId: { type: "string" },
              title: { type: "string" },
              status: { type: "string" },
              resultsPublishedAt: { type: ["string", "null"], format: "date-time" },
              totalVotes: { type: "number" },
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    candidateListId: { type: "string" },
                    name: { type: "string" },
                    order: { type: "number" },
                    isActive: { type: "boolean" },
                    votes: { type: "number" },
                    percentage: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
      CandidateList: {
        type: "object",
        properties: {
          id: { type: "string" },
          scrutinId: { type: "string" },
          name: { type: "string" },
          slogan: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/CandidateListMember" },
          },
          actionPlan: {
            type: "array",
            items: { type: "string" },
            description: "Plan d'action ou Vision de la liste candidate",
          },
          videoUrl: { type: ["string", "null"], format: "uri" },
          order: { type: "number" },
          isActive: { type: "boolean" },
        },
      },
      CandidateListMember: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
        },
      },
      CreateCandidateListInput: {
        type: "object",
        required: ["scrutinId", "name", "order"],
        properties: {
          scrutinId: { type: "string", example: "clwh2u3y8000008l2..." },
          name: { type: "string", minLength: 2, maxLength: 120, example: "Liste 'Avenir Radiant'" },
          slogan: { type: "string", maxLength: 240, example: "Ensemble pour un campus meilleur" },
          description: { type: "string", maxLength: 1500, example: "Une liste dynamique portee par des etudiants de L3." },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/CandidateListMember" },
            example: [
              { name: "Koffi Mensah", role: "President" },
              { name: "Ama Kossi", role: "Secretaire" },
            ],
          },
          actionPlan: {
            type: "array",
            items: { type: "string" },
            example: ["Amelioration de la cafeteria", "Creation d'un club de sport"],
          },
          videoUrl: { type: "string", format: "uri", example: "https://www.youtube.com/watch?v=..." },
          order: { type: "number", minimum: 1, maximum: 100, example: 1 },
        },
      },
      UpdateCandidateListInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120, example: "Liste 'Avenir Radiant' (MAJ)" },
          slogan: { type: "string", maxLength: 240, example: "Innover pour reussir" },
          description: { type: "string", maxLength: 1500, example: "Mise a jour du programme." },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/CandidateListMember" },
          },
          actionPlan: {
            type: "array",
            items: { type: "string" },
          },
          videoUrl: { type: "string", format: "uri" },
          order: { type: "number", minimum: 1, maximum: 100 },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  },
};
