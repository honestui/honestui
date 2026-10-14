"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const MapPlaceSchema = z.object({
  name: z.string(),
  query: z.string().optional(),
  note: z.string().optional(),
});
