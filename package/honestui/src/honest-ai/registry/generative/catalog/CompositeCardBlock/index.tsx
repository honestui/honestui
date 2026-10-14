"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { CompositeCardBlockSchema } from "./schema";

export * from "./schema";

/** Composite cards keep text size, metric size and chart height visually consistent. */

export const CompositeCardBlock = defineComponent({
  name: "CompositeCardBlock",
  props: CompositeCardBlockSchema,
  description:
    "A two-per-row grid or carousel of rich cards, each with an optional header, stacked body content (text, metrics, charts, lists, tags) and a price/button footer; an optional action makes every card clickable.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "CompositeCardBlock",
      props,
      renderNode,
    }),
});
