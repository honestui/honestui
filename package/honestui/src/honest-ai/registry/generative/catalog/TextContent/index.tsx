"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TextContentSchema } from "./schema";

export { TextContentSchema } from "./schema";

export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy". Optional color: "default" | "muted" | "info" | "success" | "warning" | "danger".',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "TextContent",
      props,
      renderNode,
    }),
});
