"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ChipsSchema } from "./schema";

export * from "./schema";

export const Chips = defineComponent({
  name: "Chips",
  props: ChipsSchema,
  description:
    "A form field of compact selectable chips for choosing one or many short options; the selection is stored under `name`.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Chips", props, renderNode }),
});
