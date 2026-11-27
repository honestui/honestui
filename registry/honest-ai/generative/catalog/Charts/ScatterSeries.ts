"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { z } from "zod/v4";
import { GeneratedComponent } from "../../renderers/generated-component";
import { defineComponent } from "../../runtime/react/index";
import { PointSchema } from "./Point";

export const ScatterSeriesSchema = z.object({
  name: z.string(),
  points: z.array(PointSchema),
});

export const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: ScatterSeriesSchema,
  description: "Named dataset",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "ScatterSeries",
      props,
      renderNode,
    }),
});
