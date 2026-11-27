"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({
    text: z.string(),
  }),
  description:
    "Clickable follow-up suggestion — when clicked, sends text as user message",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "FollowUpItem",
      props,
      renderNode,
    }),
});
