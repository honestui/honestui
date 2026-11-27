"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description:
    "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "PieChart", props, renderNode }),
});
