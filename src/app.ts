import path from "node:path";
import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./infrastructure/logger/logger";
import { prisma } from "./infrastructure/prisma/client";
import { swaggerDocument } from "./docs/swagger";
import { healthRouter } from "./modules/health/routes/health.routes";
import { otpRouter } from "./modules/otp/routes/otp.routes";
import { scrutinRouter } from "./modules/scrutins/routes/scrutin.routes";
import { voteRouter } from "./modules/votes/routes/vote.routes";
import { authRouter } from "./modules/auth/routes/auth.routes";
import { scrutinAdminRouter } from "./modules/scrutins/routes/scrutin.admin.routes";
import { candidateListAdminRouter } from "./modules/candidate-lists/routes/candidate-list.routes";
import {
  adminRateLimiter,
  corsMiddleware,
  docsRateLimiter,
  helmetMiddleware,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
  publicReadRateLimiter,
  voteRateLimiter,
} from "./shared/middleware/security";
import { notFoundHandler } from "./shared/middleware/notFoundHandler";
import { errorHandler } from "./shared/middleware/errorHandler";
import {
  buildSwaggerIndexHtml,
  swaggerUiIndexHtmlHandler,
  swaggerUiInitMiddleware,
} from "./shared/swagger/swaggerDocs";

const swaggerIndexHtml = buildSwaggerIndexHtml(swaggerDocument, {
  title: "VoteGBDE API",
  swaggerOptions: {
    docExpansion: "list",
    filter: true,
  },
});

export const app = express();

app.set("trust proxy", 1);

app.use(pinoHttp({ logger }));
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public"), { index: false }));

app.get("/", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let database: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }
  res.status(200).json({
    service: "VoteGBDE API",
    status: "running",
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime() * 1000) / 1000,
    database,
    message:
      database === "ok"
        ? "API opérationnelle, base joignable. Santé : GET /api/health · Documentation Swagger : /api/docs"
        : "API démarrée mais la base de données ne répond pas. Vérifiez DATABASE_URL ou NEON_DATABASE_URL sur l'hébergeur.",
    links: {
      health: "/api/health",
      docs: "/api/docs",
      openApiJson: "/api/docs.json",
    },
  });
});

app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerDocument);
});
app.use(
  "/api/docs",
  docsRateLimiter,
  swaggerUiInitMiddleware(),
  swaggerUiIndexHtmlHandler(swaggerIndexHtml),
);

app.use("/api/health", publicReadRateLimiter);
app.use("/api/scrutin", publicReadRateLimiter);
app.use("/api/auth/login/verify", otpVerifyRateLimiter);
app.use("/api/otp/send", otpSendRateLimiter);
app.use("/api/otp/verify", otpVerifyRateLimiter);
app.use("/api/vote", voteRateLimiter);
app.use("/api/auth", adminRateLimiter);
app.use("/api/admin", adminRateLimiter);

app.use("/api", healthRouter);
app.use("/api", scrutinRouter);
app.use("/api", otpRouter);
app.use("/api", voteRouter);
app.use("/api", authRouter);
app.use("/api", scrutinAdminRouter);
app.use("/api", candidateListAdminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
