"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { ListItem } from "../ListItem";

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
    variant: z.enum(["number", "image"]).optional(),
    size: z.enum(["default", "small"]).optional(),
  }),
  description:
    "A list of items with number or image indicators. Each item can optionally have an action. size small renders a compact list.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "ListBlock", props, renderNode }),
});
