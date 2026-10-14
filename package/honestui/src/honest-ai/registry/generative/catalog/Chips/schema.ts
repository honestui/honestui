"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { z } from "zod/v4";
import { GeneratedComponent } from "../../renderers/generated-component";
import { defineComponent } from "../../runtime/react/index";
import { Icon } from "../Icon";
import { rulesSchema } from "../rules";

export const ChipItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.optional(Icon.ref),
  disabled: z.boolean().optional(),
});

export type ChipItemProps = z.infer<typeof ChipItemSchema>;

export const ChipItem = defineComponent({
  name: "ChipItem",
  props: ChipItemSchema,
  description:
    "A single selectable chip inside a Chips group, with a value, label and optional icon.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "ChipItem", props, renderNode }),
});

export const ChipsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("multiple"),
  items: z.array(ChipItem.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ChipsProps = z.infer<typeof ChipsSchema>;
