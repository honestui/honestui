"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const ImageSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
});
