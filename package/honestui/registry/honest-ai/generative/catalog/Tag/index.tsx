"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { TagSchema } from "./schema";

export * from "./schema";

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description:
    'Badge with optional Icon. variant sets the color by meaning. fill: "soft" (default) is a tinted background, "solid" is a filled badge for the one status that must stand out, "outline" is a bordered badge with no background.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Tag", props, renderNode }),
});
