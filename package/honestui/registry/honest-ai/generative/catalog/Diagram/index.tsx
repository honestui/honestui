"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { DiagramNodeSchema } from "./schema";

export { DiagramNodeSchema } from "./schema";

export const DiagramNode = defineComponent({
  name: "DiagramNode",
  props: DiagramNodeSchema,
  description:
    "One box in a Diagram: title names the thing, value is the literal it holds (shown in monospace), detail is one short line about it",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "DiagramNode", props, renderNode }),
});

export const Diagram = defineComponent({
  name: "Diagram",
  props: z.object({
    nodes: z.array(DiagramNode.ref),
    arrows: z.array(z.string()).optional(),
    caption: z.string().optional(),
  }),
  description:
    "A chain of 2–4 boxes joined by arrows, for how one thing refers to, becomes or flows into the next. arrows[i] labels the arrow from nodes[i] to nodes[i+1]. caption marks illustrative values.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Diagram", props, renderNode }),
});
