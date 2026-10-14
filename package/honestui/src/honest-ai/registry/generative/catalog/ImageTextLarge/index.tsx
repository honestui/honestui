"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ImageTextLargeSchema } from "./schema";

export * from "./schema";

export const ImageTextLarge = defineComponent({
  name: "ImageTextLarge",
  props: ImageTextLargeSchema,
  description:
    "A full-width banner image above a bold title and optional subtitle. src must be a real image URL.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ImageTextLarge",
      props,
      renderNode,
    }),
});
