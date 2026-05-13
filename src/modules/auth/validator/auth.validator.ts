import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(20),
});

export const logoutSchema = z.object({
  refreshToken: z.string().trim().min(20),
});

export const verifyLoginOtpSchema = z.object({
  otpSessionToken: z.string().trim().min(32),
  otp: z.string().trim().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
});
