"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TextAreaSchema } from "./schema";

export { TextAreaSchema } from "./schema";

export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "TextArea", props, renderNode }),
});
