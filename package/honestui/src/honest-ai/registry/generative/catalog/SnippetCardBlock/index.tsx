"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { SnippetCardBlockSchema } from "./schema";

export * from "./schema";

export const SnippetCardBlock = defineComponent({
  name: "SnippetCardBlock",
  props: SnippetCardBlockSchema,
  description:
    "A responsive grid of compact label/value cards (2 per row) for showing several short facts side by side; optionally clickable with a shared action.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SnippetCardBlock",
      props,
      renderNode,
    }),
});
