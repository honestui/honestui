"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { IconTextSchema } from "./schema";

export * from "./schema";

export const IconText = defineComponent({
  name: "IconText",
  props: IconTextSchema,
  description:
    "An icon badge with a title and optional subtitle, laid out horizontally or vertically. iconVariant sets the badge color.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "IconText", props, renderNode }),
});
