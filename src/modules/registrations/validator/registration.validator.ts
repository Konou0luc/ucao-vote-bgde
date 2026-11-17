import { z } from "zod";

export const registerStudentSchema = z.object({
  matricule: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Matricule invalide : lettres, chiffres et tirets uniquement")
    .transform((v) => v.toUpperCase()),
  firstName: z.string().trim().min(2).max(120),
  lastName: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
  facultyCode: z.string().trim().min(2).max(20),
  departmentCode: z.string().trim().min(1).max(20),
  levelName: z.enum(["L1", "L2", "L3"]),
});

export const verifyRegistrationSchema = z.object({
  sessionToken: z.string().trim().min(20).max(128),
  otp: z.string().trim().regex(/^\d{6}$/),
});
