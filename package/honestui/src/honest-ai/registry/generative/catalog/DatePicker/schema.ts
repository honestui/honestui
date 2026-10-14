"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";
import { rulesSchema } from "../rules";

export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]).optional(),
  rules: rulesSchema,
  value: reactive(z.unknown().optional()),
});
