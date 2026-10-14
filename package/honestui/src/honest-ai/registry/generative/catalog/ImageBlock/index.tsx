"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ImageBlockSchema } from "./schema";

export { ImageBlockSchema } from "./schema";

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: ImageBlockSchema,
  description: "Image block with loading state",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ImageBlock",
      props,
      renderNode,
    }),
});
