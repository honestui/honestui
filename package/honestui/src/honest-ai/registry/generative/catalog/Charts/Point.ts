"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { z } from "zod/v4";
import { GeneratedComponent } from "../../renderers/generated-component";
import { defineComponent } from "../../runtime/react/index";

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

export const Point = defineComponent({
  name: "Point",
  props: PointSchema,
  description: "Data point with numeric coordinates",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Point", props, renderNode }),
});
