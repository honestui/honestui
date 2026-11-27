"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { ContentChildUnion } from "../unions";

/** Shared renderer — also used by the chat library's Carousel variant (wider content union). */

export const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ContentChildUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Carousel", props, renderNode }),
});
