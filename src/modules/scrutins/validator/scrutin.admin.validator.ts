import { z } from "zod";

const scrutinStatusEnum = z.enum(["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "ARCHIVED"]);

export const createScrutinSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1500).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: scrutinStatusEnum.optional(),
});

export const updateScrutinSchema = z
  .object({
    title: z.string().trim().min(3).max(180).optional(),
    description: z.string().trim().max(1500).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    status: scrutinStatusEnum.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Au moins un champ doit etre fourni",
  });

export const scrutinIdParamSchema = z.object({
  id: z.string().min(5).max(64),
});
