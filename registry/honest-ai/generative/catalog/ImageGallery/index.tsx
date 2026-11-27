"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ImageGallerySchema } from "./schema";

export { ImageGallerySchema } from "./schema";

export const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: ImageGallerySchema,
  description: "Gallery grid of images with modal preview",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ImageGallery",
      props,
      renderNode,
    }),
});
