import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "./infrastructure/logger/logger";
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

export const app = express();

app.use(pinoHttp({ logger }));
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());

app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerDocument);
});
app.use(
  "/api/docs",
  docsRateLimiter,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      docExpansion: "list",
      filter: true,
    },
  }),
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
