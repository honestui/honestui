"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  decorative: z.boolean().optional(),
});
