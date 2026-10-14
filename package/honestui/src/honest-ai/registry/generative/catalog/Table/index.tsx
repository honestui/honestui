"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { ColSchema } from "./schema";

export { ColSchema } from "./schema";

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition — holds label + data array",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Col", props, renderNode }),
});

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
  }),
  description:
    "Data table — column-oriented. Each Col holds its own data array.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Table", props, renderNode }),
});
