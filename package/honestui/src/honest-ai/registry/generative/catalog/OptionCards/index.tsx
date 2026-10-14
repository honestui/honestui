"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { OptionCardsSchema } from "./schema";

export * from "./schema";

export const OptionCards = defineComponent({
  name: "OptionCards",
  props: OptionCardsSchema,
  description:
    "A form field of selectable cards (title, optional subtitle, optional icon or image) laid out in a responsive grid for choosing one or many options; the selection is stored under `name`.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "OptionCards",
      props,
      renderNode,
    }),
});
