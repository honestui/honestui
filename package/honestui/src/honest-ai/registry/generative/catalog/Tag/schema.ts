"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { Icon } from "../Icon";

export const TagSchema = z.object({
  text: z.string(),
  icon: z.optional(Icon.ref),
  size: z.enum(["sm", "md", "lg"]).optional(),
  variant: z
    .enum(["neutral", "info", "success", "warning", "danger"])
    .optional(),
  fill: z.enum(["soft", "solid", "outline"]).optional(),
});
