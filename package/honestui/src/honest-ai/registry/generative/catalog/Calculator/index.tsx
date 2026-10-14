"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";
import { Buttons } from "../Buttons";
import { FormControl } from "../FormControl";

import { ResultSchema } from "./schema";

export { ResultSchema } from "./schema";

export const Result = defineComponent({
  name: "Result",
  props: ResultSchema,
  description:
    'One live answer in a Calculator. value is an expression over the inputs\' $variables. format: "number" (default) | "currency" (with an ISO currency code, default "USD") | "percent" (pass the percentage: 5 shows 5%). Currency drops cents from 1,000 up unless decimals is set. The first Result is shown largest.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Result", props, renderNode }),
});

export const Calculator = defineComponent({
  name: "Calculator",
  props: z.object({
    inputs: z.array(FormControl.ref),
    results: z.array(Result.ref),
    formula: z.string(),
    actions: z.optional(Buttons.ref),
  }),
  description:
    "Inputs bound to $variables beside Results that recompute as the user changes them, with no submit button. formula states how the results are calculated and every assumption, in plain words. actions is an optional Buttons row under the inputs, such as a button that reruns a simulation.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Calculator", props, renderNode }),
});
