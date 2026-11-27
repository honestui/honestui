"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const TextSchema = z.object({
  variant: z.enum(["text", "number"]).default("text"),
  value: z.string(),
  subtext: z.string().optional(),
  subtextVariant: z.enum(["text", "number", "metric"]).default("text"),
  size: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
  color: z
    .enum(["default", "muted", "info", "success", "warning", "danger"])
    .optional(),
});
export type TextProps = z.infer<typeof TextSchema>;
