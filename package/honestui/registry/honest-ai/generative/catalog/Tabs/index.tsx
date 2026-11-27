"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { TabItemSchema } from "./schema";

export { TabItemSchema } from "./schema";

export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description:
    "value is unique id, trigger is tab label, content is array of components",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "TabItem", props, renderNode }),
});

/** Shared renderer — also used by the chat library's Tabs variant (wider content union). */

export const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItem.ref),
  }),
  description: "Tabbed container",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Tabs", props, renderNode }),
});
