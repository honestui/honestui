"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { CalloutSchema } from "./schema";

export { CalloutSchema } from "./schema";

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description:
    "Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Callout", props, renderNode }),
});
