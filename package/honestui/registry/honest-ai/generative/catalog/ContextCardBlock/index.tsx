"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ContextCardBlockSchema } from "./schema";

export * from "./schema";

export const ContextCardBlock = defineComponent({
  name: "ContextCardBlock",
  props: ContextCardBlockSchema,
  description:
    "A grid or carousel of compact tinted context cards (title or tag plus a short bold body); an optional action makes every card clickable.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ContextCardBlock",
      props,
      renderNode,
    }),
});
