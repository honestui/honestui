"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { CodeBlockSchema } from "./schema";

export { CodeBlockSchema } from "./schema";

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: CodeBlockSchema,
  description: "Syntax-highlighted code block",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "CodeBlock", props, renderNode }),
});
