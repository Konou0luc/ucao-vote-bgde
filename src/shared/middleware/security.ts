import cors from "cors";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import type { Request, RequestHandler } from "express";
import { env } from "../../config/env";
import { logger } from "../../infrastructure/logger/logger";

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://unpkg.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https:", "https://unpkg.com"],
      "img-src": ["'self'", "data:", "https:", "https://unpkg.com"],
      "font-src": ["'self'", "https:", "data:", "https://unpkg.com"],
      "connect-src": ["'self'", "https://unpkg.com"],
    },
  },
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => {
      const t = o.trim();
      return t.endsWith("/") ? t.slice(0, -1) : t;
    });

    const normalizedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      logger.warn({ origin, allowedOrigins }, "CORS blocked");
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
});

function createLimiter(limit: number, keyGenerator?: (req: Request) => string): RequestHandler {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit,
    ...(keyGenerator ? { keyGenerator } : {}),
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const rateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_MAX);

export const publicReadRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_PUBLIC_MAX);

export const otpSendRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_OTP_SEND_MAX, (req) => {
  const body = req.body as { matricule?: unknown } | undefined;
  const matricule = typeof body?.matricule === "string" ? body.matricule.trim().toUpperCase() : "";
  return matricule ? `otp-send:${matricule}` : `otp-send-ip:${ipKeyGenerator(req.ip || "")}`;
});

export const otpVerifyRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_OTP_VERIFY_MAX, (req) => {
  const body = req.body as { sessionToken?: unknown } | undefined;
  const sessionToken = typeof body?.sessionToken === "string" ? body.sessionToken.trim() : "";
  return sessionToken ? `otp-verify:${sessionToken}` : `otp-verify-ip:${ipKeyGenerator(req.ip || "")}`;
});

/** Inscription étudiante : limitée par adresse IP (même plafond que l'envoi d'OTP). */
export const registrationRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_OTP_SEND_MAX);

export const voteRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_VOTE_MAX);

export const adminRateLimiter: RequestHandler = createLimiter(env.RATE_LIMIT_ADMIN_MAX);

export const docsRateLimiter: RequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: Math.max(Math.floor(env.RATE_LIMIT_PUBLIC_MAX / 2), 300),
  standardHeaders: true,
  legacyHeaders: false,
});
