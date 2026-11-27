"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { SelectItemSchema, createSelectSchema } from "./schema";

export { SelectItemSchema } from "./schema";

export const SelectItem = defineComponent({
  name: "SelectItem",
  props: SelectItemSchema,
  description: "Option for Select",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SelectItem",
      props,
      renderNode,
    }),
});

export const Select = defineComponent({
  name: "Select",
  props: createSelectSchema(SelectItem),
  description: "",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Select", props, renderNode }),
});
