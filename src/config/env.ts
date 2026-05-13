import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  UCAO_API_BASE_URL: z.string().url(),
  UCAO_API_KEY: z.string().min(16),
  UCAO_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  MAIL_TRANSPORT: z.enum(["json", "smtp"]).default("json"),
  MAIL_FROM: z.string().email().default("no-reply@ucao-uut.tg"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_PUBLIC_MAX: z.coerce.number().int().positive().default(5000),
  RATE_LIMIT_OTP_SEND_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_OTP_VERIFY_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_VOTE_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_ADMIN_MAX: z.coerce.number().int().positive().default(300),
  NEON_DATABASE_URL: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const messages = parsedEnv.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Variables d'environnement invalides:\n${messages.join("\n")}`);
}

export const env = parsedEnv.data;
