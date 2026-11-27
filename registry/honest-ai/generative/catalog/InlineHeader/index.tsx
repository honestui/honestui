"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { InlineHeaderSchema } from "./schema";

export * from "./schema";

export const InlineHeader = defineComponent({
  name: "InlineHeader",
  props: InlineHeaderSchema,
  description:
    "Compact section heading with an optional one-line description, for use inside cards.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "InlineHeader",
      props,
      renderNode,
    }),
});
