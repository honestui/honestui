"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { AccordionItemSchema } from "./schema";

export { AccordionItemSchema } from "./schema";

export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "value is unique id, trigger is section title",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "AccordionItem",
      props,
      renderNode,
    }),
});

/** Shared renderer — also used by the chat library's Accordion variant (wider content union). */

export const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItem.ref),
  }),
  description: "Collapsible sections",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Accordion", props, renderNode }),
});
