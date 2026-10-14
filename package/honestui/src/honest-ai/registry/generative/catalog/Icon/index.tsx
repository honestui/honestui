"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { IconSchema } from "./schema";

export * from "./schema";

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description:
    "A Honest UI icon by kebab-case name (e.g. 'circle-check'). Optional category picks a topical fallback when the name doesn't resolve.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Icon", props, renderNode }),
});
