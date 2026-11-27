"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { DatePickerSchema } from "./schema";

export { DatePickerSchema } from "./schema";

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: 'Honest UI calendar picker. Use mode "single" for one date (YYYY-MM-DD), or "range" for a start and end date. Wrap in FormControl inside Form.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "DatePicker",
      props,
      renderNode,
    }),
});
