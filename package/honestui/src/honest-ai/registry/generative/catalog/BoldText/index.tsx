"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { BoldTextSchema } from "./schema";

export * from "./schema";

export const BoldText = defineComponent({
  name: "BoldText",
  props: BoldTextSchema,
  description:
    "Emphasized (bold) text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red. Optional color for the value: 'default' | 'muted' | 'info' | 'success' | 'warning' | 'danger'.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "BoldText", props, renderNode }),
});
