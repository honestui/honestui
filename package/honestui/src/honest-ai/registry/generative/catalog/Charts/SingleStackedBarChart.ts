"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

export const SingleStackedBarChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description:
    "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SingleStackedBarChart",
      props,
      renderNode,
    }),
});
