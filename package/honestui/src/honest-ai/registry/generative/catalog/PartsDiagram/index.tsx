"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { DiagramPartSchema } from "./schema";

export { DiagramPartSchema } from "./schema";

export const DiagramPart = defineComponent({
  name: "DiagramPart",
  props: DiagramPartSchema,
  description:
    "One part: label names it, value is the literal it holds (shown in monospace), detail is one short line on what it does, size is its relative width in a row (such as bytes).",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "DiagramPart", props, renderNode }),
});

export const PartsDiagram = defineComponent({
  name: "PartsDiagram",
  props: z.object({
    parts: z.array(DiagramPart.ref),
    arrangement: z.enum(["row", "stack", "nested"]),
    caption: z.string().optional(),
  }),
  description:
    'The labeled parts of one thing. "row": parts side by side, in order (2–8, e.g. the pieces of a URL or the fields of a header). "stack": layers, top first (2–7, e.g. network layers). "nested": each part inside the one before, outermost first (2–5, e.g. the CSS box model).',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "PartsDiagram", props, renderNode }),
});
