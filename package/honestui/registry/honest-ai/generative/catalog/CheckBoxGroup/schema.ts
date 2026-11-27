"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";
import { rulesSchema } from "../rules";

type RefComponent = { ref: any };

export const CheckBoxItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export function createCheckBoxGroupSchema(CheckBoxItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
    rules: rulesSchema,
    value: reactive(z.record(z.string(), z.boolean()).optional()),
  });
}
