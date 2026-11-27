"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";
import { SectionContentChildUnion } from "../sectionContentUnion";

export const SectionItem = defineComponent({
  name: "SectionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(SectionContentChildUnion),
  }),
  description:
    "Section with a label and collapsible content — used inside SectionBlock",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SectionItem",
      props,
      renderNode,
    }),
});
