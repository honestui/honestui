"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";
import { ContentChildUnion } from "../unions";

export const ModalSchema = z.object({
  title: z.string(),
  open: reactive(z.boolean().optional()),
  children: z.array(ContentChildUnion),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
