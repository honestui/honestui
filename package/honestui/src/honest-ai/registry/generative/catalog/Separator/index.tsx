"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { SeparatorSchema } from "./schema";

export * from "./schema";

export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: "Visual divider between content sections",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Separator", props, renderNode }),
});
