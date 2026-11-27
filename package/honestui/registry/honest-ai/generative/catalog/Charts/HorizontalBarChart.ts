"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SeriesSchema } from "./Series";

export const HorizontalBarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const HorizontalBarChart = defineComponent({
  name: "HorizontalBarChart",
  props: HorizontalBarChartSchema,
  description:
    "Horizontal bars; prefer when category labels are long or for ranked lists",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "HorizontalBarChart",
      props,
      renderNode,
    }),
});
