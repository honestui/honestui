"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";

export const CalloutSchema = z.object({
  variant: z.enum(["info", "warning", "error", "success", "neutral"]),
  title: z.string(),
  description: z.string(),
  visible: reactive(z.boolean().optional()),
});
