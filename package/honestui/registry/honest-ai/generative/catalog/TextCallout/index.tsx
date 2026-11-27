"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TextCalloutSchema } from "./schema";

export { TextCalloutSchema } from "./schema";

export const TextCallout = defineComponent({
  name: "TextCallout",
  props: TextCalloutSchema,
  description: "Text callout with variant, title, and description",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "TextCallout",
      props,
      renderNode,
    }),
});
