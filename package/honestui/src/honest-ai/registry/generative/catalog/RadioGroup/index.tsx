"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent, reactive } from "../../runtime/react/index";

import { rulesSchema } from "../rules";
import { RadioItemSchema } from "./schema";

export { RadioItemSchema } from "./schema";

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "One labeled option in a RadioGroup. Use a stable value for the submitted answer.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "RadioItem", props, renderNode }),
});

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({
    name: z.string(),
    items: z.array(RadioItem.ref),
    defaultValue: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
  }),
  description: "Single-choice input for multiple-choice quizzes, surveys, and short visible option lists. Wrap in FormControl inside Form; omit defaultValue when the user should choose an answer.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "RadioGroup",
      props,
      renderNode,
    }),
});
