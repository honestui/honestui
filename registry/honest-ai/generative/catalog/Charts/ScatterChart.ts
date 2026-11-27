"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { ScatterSeriesSchema } from "./ScatterSeries";

export const ScatterChartSchema = z.object({
  datasets: z.array(ScatterSeriesSchema),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description:
    "X/Y scatter plot; use for correlations, distributions, and clustering",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ScatterChart",
      props,
      renderNode,
    }),
});
