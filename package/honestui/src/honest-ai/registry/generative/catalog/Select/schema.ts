"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";
import { rulesSchema } from "../rules";

type RefComponent = { ref: any };

export const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export function createSelectSchema(SelectItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
    size: z.enum(["small", "medium", "large"]).optional(),
  });
}
