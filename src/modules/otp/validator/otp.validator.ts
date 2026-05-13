import { z } from "zod";

export const sendOtpSchema = z.object({
  matricule: z.string().trim().min(3).max(32),
  email: z.string().trim().email().max(255),
});

export const verifyOtpSchema = z.object({
  sessionToken: z.string().trim().min(20).max(128),
  otp: z.string().trim().regex(/^\d{6}$/),
});
