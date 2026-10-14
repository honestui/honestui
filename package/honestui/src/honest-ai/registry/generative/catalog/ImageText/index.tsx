"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ImageTextSchema } from "./schema";

export * from "./schema";

export const ImageText = defineComponent({
  name: "ImageText",
  props: ImageTextSchema,
  description:
    "A small square image (thumbnail/avatar) with a title and optional subtitle. src must be a real image URL.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "ImageText", props, renderNode }),
});
