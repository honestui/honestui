"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const ResultSchema = z.object({
  label: z.string(),
  value: z.number(),
  format: z.enum(["number", "currency", "percent"]).optional(),
  detail: z.string().optional(),
  currency: z.string().optional(),
  decimals: z.number().optional(),
});
