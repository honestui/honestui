"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SeriesSchema } from "./Series";

export const AreaChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});

export const AreaChartCondensed = defineComponent({
  name: "AreaChart",
  props: AreaChartCondensedSchema,
  description:
    "Filled area under lines; use for cumulative totals or volume trends over time",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "AreaChart", props, renderNode }),
});
