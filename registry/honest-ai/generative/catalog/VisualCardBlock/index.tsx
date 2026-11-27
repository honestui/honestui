"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { VisualCardBlockSchema } from "./schema";

export * from "./schema";

export const VisualCardBlock = defineComponent({
  name: "VisualCardBlock",
  props: VisualCardBlockSchema,
  description:
    "A grid or carousel of photo-first cards: a full-bleed background image with a tag on top and a bold text panel at the bottom; an optional action makes every card clickable.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "VisualCardBlock",
      props,
      renderNode,
    }),
});
