import { z } from "zod";

export const castVoteSchema = z.object({
  sessionToken: z.string().trim().min(20).max(128),
  candidateListId: z.string().trim().min(8).max(64),
});
