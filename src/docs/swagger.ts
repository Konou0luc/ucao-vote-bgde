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
        summary: "Resultats publics d'un scrutin",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Resultats publies",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScrutinResultsResponse" },
              },
            },
          },
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
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCandidateListInput" },
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
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCandidateListInput" },
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
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
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
            },
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              tokenType: { type: "string", example: "Bearer" },
              expiresIn: { type: "string" },
              admin: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string" },
                  permissions: { type: "array", items: { type: "string" } },
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
        },
      },
      CreateScrutinInput: {
        type: "object",
        required: ["title", "startsAt", "endsAt"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 180 },
          description: { type: "string", maxLength: 1500 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "ARCHIVED"] },
        },
      },
      UpdateScrutinInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 180 },
          description: { type: "string", maxLength: 1500 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "ARCHIVED"] },
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
          scrutinId: { type: "string" },
          name: { type: "string", minLength: 2, maxLength: 120 },
          slogan: { type: "string", maxLength: 240 },
          description: { type: "string", maxLength: 1500 },
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
        },
      },
      UpdateCandidateListInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120 },
          slogan: { type: "string", maxLength: 240 },
          description: { type: "string", maxLength: 1500 },
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
          isActive: { type: "boolean" },
        },
      },
    },
  },
};
