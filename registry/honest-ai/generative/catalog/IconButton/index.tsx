"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { IconButtonSchema } from "./schema";

export * from "./schema";

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description:
    "Icon-only button. name is the accessible label and the action label; icon is an Icon; action fires on click.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "IconButton",
      props,
      renderNode,
    }),
});
