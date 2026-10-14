"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { CheckBoxItemSchema, createCheckBoxGroupSchema } from "./schema";

export { CheckBoxItemSchema } from "./schema";

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "One labeled checkbox option with a unique name and optional initial checked state.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "CheckBoxItem",
      props,
      renderNode,
    }),
});

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: createCheckBoxGroupSchema(CheckBoxItem),
  description: "Multiple-choice input where zero, one, or several answers can be selected. Wrap in FormControl inside Form.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "CheckBoxGroup",
      props,
      renderNode,
    }),
});
