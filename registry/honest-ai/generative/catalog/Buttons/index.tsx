"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ButtonsSchema } from "./schema";

export { ButtonsSchema } from "./schema";

export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description:
    'Group of Button components. direction: "row" (default) | "column".',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Buttons", props, renderNode }),
});
