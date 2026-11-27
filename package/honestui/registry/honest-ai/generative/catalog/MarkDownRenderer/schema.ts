"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const MarkDownRendererSchema = z.object({
  textMarkdown: z.string(),
  variant: z.enum(["clear", "card", "sunk"]).optional(),
});
