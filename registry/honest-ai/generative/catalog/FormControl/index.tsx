"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { FormControlSchema } from "./schema";

export { FormControlSchema } from "./schema";

/**
 * Shared renderer — also used by the chat library's FormControl variant, which
 * accepts a wider set of input components (Chips, OptionCards).
 */

export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "FormControl",
      props,
      renderNode,
    }),
});
