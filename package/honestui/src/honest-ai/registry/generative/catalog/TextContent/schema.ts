"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const TextContentSchema = z.object({
  text: z.string(),
  size: z
    .enum(["small", "default", "large", "small-heavy", "large-heavy"])
    .optional(),
  color: z
    .enum(["default", "muted", "info", "success", "warning", "danger"])
    .optional(),
});
