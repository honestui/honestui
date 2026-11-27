"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ButtonSchema } from "./schema";

export { ButtonSchema } from "./schema";

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description:
    'Clickable button. fill applies to a primary or destructive button: "solid" (default) is filled, "outline" is bordered with no fill.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Button", props, renderNode }),
});
