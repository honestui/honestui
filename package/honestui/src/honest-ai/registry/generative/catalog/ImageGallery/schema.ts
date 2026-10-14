"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

const ImageItemSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  details: z.string().optional(),
});

export const ImageGallerySchema = z.object({
  images: z.array(ImageItemSchema),
});
