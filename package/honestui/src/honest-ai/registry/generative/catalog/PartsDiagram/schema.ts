"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const DiagramPartSchema = z.object({
  label: z.string(),
  value: z.string().optional(),
  detail: z.string().optional(),
  size: z.number().optional(),
});
