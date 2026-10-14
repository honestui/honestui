"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});
