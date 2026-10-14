"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { MarkDownRendererSchema } from "./schema";

export { MarkDownRendererSchema } from "./schema";

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Renders markdown text with optional container variant",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "MarkDownRenderer",
      props,
      renderNode,
    }),
});
