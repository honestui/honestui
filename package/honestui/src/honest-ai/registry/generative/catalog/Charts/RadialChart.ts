"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

export const RadialChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description:
    "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "RadialChart",
      props,
      renderNode,
    }),
});
