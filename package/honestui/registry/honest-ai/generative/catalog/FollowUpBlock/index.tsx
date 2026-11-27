"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { FollowUpItem } from "../FollowUpItem";

export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({
    items: z.array(FollowUpItem.ref),
  }),
  description:
    "List of clickable follow-up suggestions placed at the end of a response",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "FollowUpBlock",
      props,
      renderNode,
    }),
});
