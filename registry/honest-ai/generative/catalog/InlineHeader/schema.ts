"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const InlineHeaderSchema = z.object({
  heading: z.string(),
  description: z.string().optional(),
});
export type InlineHeaderProps = z.infer<typeof InlineHeaderSchema>;
