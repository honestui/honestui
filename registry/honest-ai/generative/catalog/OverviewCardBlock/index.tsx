"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { OverviewCardBlockSchema } from "./schema";

export * from "./schema";

export const OverviewCardBlock = defineComponent({
  name: "OverviewCardBlock",
  props: OverviewCardBlockSchema,
  description:
    "A grid or horizontal carousel of compact overview cards, each with a heading (icon/image/text) on top and an inline metric below; optionally clickable with a shared action.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "OverviewCardBlock",
      props,
      renderNode,
    }),
});
