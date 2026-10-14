"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SeriesSchema } from "./Series";

export const RadarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
});

export const RadarChart = defineComponent({
  name: "RadarChart",
  props: RadarChartSchema,
  description:
    "Spider/web chart; use for comparing multiple variables across one or more entities",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "RadarChart",
      props,
      renderNode,
    }),
});
