"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { z } from "zod/v4";
import { GeneratedComponent } from "../../renderers/generated-component";
import { defineComponent } from "../../runtime/react/index";
import { actionPropSchema } from "../Action/schema";
import { Tag } from "../Tag";

const contextCardBgColorSchema = z.enum(["gray"]);

export const ContextCardItemSchema = z.object({
  id: z.string().optional(),
  title: z.union([z.string(), Tag.ref]),
  body: z.string().optional(),
  bgColor: contextCardBgColorSchema.optional(),
  bgImageSrc: z.string().optional(),
  bgImageAlt: z.string().optional(),
});

export type ContextCardItemProps = z.infer<typeof ContextCardItemSchema>;

export const ContextCardItem = defineComponent({
  name: "ContextCardItem",
  props: ContextCardItemSchema,
  description:
    "A single card inside a ContextCardBlock: a title (plain string or Tag), an optional markdown body, and an optional gray tint or background image.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ContextCardItem",
      props,
      renderNode,
    }),
});

export const ContextCardBlockSchema = z.object({
  items: z.array(ContextCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});

export type ContextCardBlockProps = z.infer<typeof ContextCardBlockSchema>;
