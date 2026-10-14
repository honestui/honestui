"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { z } from "zod/v4";
import { GeneratedComponent } from "../../renderers/generated-component";
import { defineComponent } from "../../runtime/react/index";

export const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One data series",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Series", props, renderNode }),
});
