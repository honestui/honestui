"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";
import { FormSchema } from "./schema";

export { FormSchema } from "./schema";

/** Shared renderer — also used by the chat library's Form variant (wider FormControl). */

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Form", props, renderNode }),
});
