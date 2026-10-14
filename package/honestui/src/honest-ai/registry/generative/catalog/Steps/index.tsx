"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { StepsItemSchema } from "./schema";

export { StepsItemSchema } from "./schema";

export const StepsItem = defineComponent({
  name: "StepsItem",
  props: StepsItemSchema,
  description: "title and details text for one step",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "StepsItem", props, renderNode }),
});

export const Steps = defineComponent({
  name: "Steps",
  props: z.object({
    items: z.array(StepsItem.ref),
  }),
  description: "Step-by-step guide",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Steps", props, renderNode }),
});
