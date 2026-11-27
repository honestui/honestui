"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TagBlockSchema } from "./schema";

export * from "./schema";

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: TagBlockSchema,
  description: "tags is an array of strings; optional size sm | md | lg",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "TagBlock", props, renderNode }),
});
