"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { LabelSchema } from "./schema";

export { LabelSchema } from "./schema";

export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Text label",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Label", props, renderNode }),
});
