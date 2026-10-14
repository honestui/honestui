"use client";
import { z } from "zod/v4";
export const IconSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
});
export type IconProps = z.infer<typeof IconSchema>;
