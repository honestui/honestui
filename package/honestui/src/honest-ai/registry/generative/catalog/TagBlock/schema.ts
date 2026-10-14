"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const TagBlockSchema = z.object({
  tags: z.array(z.string()),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
