"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { SectionItem } from "../SectionItem";

/** Shared renderer — also used by the chat library's SectionBlock variant (wider SectionItem). */

export const SectionBlock = defineComponent({
  name: "SectionBlock",
  props: z.object({
    sections: z.array(SectionItem.ref),
    isFoldable: z.boolean().optional(),
  }),
  description:
    "Collapsible accordion sections. Auto-opens sections as they stream in. Use SectionItem for each section.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "SectionBlock",
      props,
      renderNode,
    }),
});
