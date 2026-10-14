"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SeriesSchema } from "./Series";

export const LineChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});

export const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: LineChartCondensedSchema,
  description:
    "Lines over categories; use for trends and continuous data over time",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "LineChart", props, renderNode }),
});
