import { z } from "zod";

const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(100),
});

export const createCandidateListSchema = z.object({
  scrutinId: z.string().min(5).max(64),
  name: z.string().trim().min(2).max(120),
  slogan: z.string().trim().max(240).optional(),
  description: z.string().trim().max(1500).optional(),
  members: z.preprocess((val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  }, z.array(memberSchema).optional()),
  actionPlan: z.preprocess((val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  }, z.array(z.string().trim().max(500)).optional()),
  videoUrl: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
  order: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number().int().min(1).max(100)),
});

export const updateCandidateListSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    slogan: z.string().trim().max(240).optional(),
    description: z.string().trim().max(1500).optional(),
    members: z.preprocess((val) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return val; }
      }
      return val;
    }, z.array(memberSchema).optional()),
    actionPlan: z.preprocess((val) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return val; }
      }
      return val;
    }, z.array(z.string().trim().max(500)).optional()),
    videoUrl: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
    imageUrl: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
    order: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number().int().min(1).max(100).optional()),
    isActive: z.preprocess((val) => (typeof val === "string" ? val === "true" : val), z.boolean().optional()),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Au moins un champ doit etre fourni",
  });

export const candidateListIdParamSchema = z.object({
  id: z.string().min(5).max(64),
});

export const scrutinIdParamSchema = z.object({
  scrutinId: z.string().min(5).max(64),
});
