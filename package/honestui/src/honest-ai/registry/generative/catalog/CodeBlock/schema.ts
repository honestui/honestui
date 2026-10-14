"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const CodeBlockSchema = z.object({
  language: z.string(),
  codeString: z.string(),
});
