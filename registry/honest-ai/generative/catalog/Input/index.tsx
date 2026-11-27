"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { InputSchema } from "./schema";

export { InputSchema } from "./schema";

export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description: "",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Input", props, renderNode }),
});
