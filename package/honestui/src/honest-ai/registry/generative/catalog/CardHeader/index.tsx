"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { CardHeaderSchema } from "./schema";

export { CardHeaderSchema } from "./schema";

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header with optional title and subtitle",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "CardHeader",
      props,
      renderNode,
    }),
});
