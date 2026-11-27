"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { SwitchItemSchema, createSwitchGroupSchema } from "./schema";

export { SwitchItemSchema } from "./schema";

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SwitchItem",
      props,
      renderNode,
    }),
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: createSwitchGroupSchema(SwitchItem),
  description: "Group of switch toggles",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SwitchGroup",
      props,
      renderNode,
    }),
});
