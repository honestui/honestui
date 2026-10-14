"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { EntityListSchema } from "./schema";

export * from "./schema";

export const EntityList = defineComponent({
  name: "EntityList",
  props: EntityListSchema,
  description:
    "Two-column key/value rows (left label, right value). size 'default' supports optional header and footer rows; rightVariant 'number' uses tabular numbers.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "EntityList",
      props,
      renderNode,
    }),
});
