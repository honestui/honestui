"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { SliderSchema } from "./schema";

export { SliderSchema } from "./schema";

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description:
    "Numeric slider input; supports continuous and discrete (stepped) variants",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Slider", props, renderNode }),
});
