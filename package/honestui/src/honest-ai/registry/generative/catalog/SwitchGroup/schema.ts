"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { reactive } from "../../runtime/react/index";

type RefComponent = { ref: any };

export const SwitchItemSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export function createSwitchGroupSchema(SwitchItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SwitchItem.ref),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
    value: reactive(z.record(z.string(), z.boolean()).optional()),
  });
}
