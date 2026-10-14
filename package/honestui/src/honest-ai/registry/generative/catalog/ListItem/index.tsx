"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";
import { actionPropSchema } from "../Action/schema";

export const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    actionLabel: z.string().optional(),
    action: actionPropSchema.optional(),
  }),
  description:
    "Item in a ListBlock — displays a title with an optional subtitle and image. When action is provided, the item becomes clickable.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "ListItem", props, renderNode }),
});
