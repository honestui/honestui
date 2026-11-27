"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TextSchema } from "./schema";

export * from "./schema";

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description:
    "Plain text line with optional subtext. variant 'number' uses tabular number styling; subtextVariant 'metric' colors a leading +/- subtext green/red. Optional color for the value: 'default' | 'muted' | 'info' | 'success' | 'warning' | 'danger'.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Text", props, renderNode }),
});
