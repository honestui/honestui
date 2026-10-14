"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SeriesSchema } from "./Series";

export const BarChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});

export const BarChartCondensed = defineComponent({
  name: "BarChart",
  props: BarChartCondensedSchema,
  description:
    "Vertical bars; use for comparing values across categories with one or more series",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "BarChart", props, renderNode }),
});
