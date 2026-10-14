"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ImageSchema } from "./schema";

export { ImageSchema } from "./schema";

export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Image with alt text and optional URL",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Image", props, renderNode }),
});
