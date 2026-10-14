"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { ModalSchema } from "./schema";

export { ModalSchema } from "./schema";

export const Modal = defineComponent({
  name: "Modal",
  props: ModalSchema,
  description:
    "Modal dialog. open is a reactive $boolean binding — set to true to open, X/Escape/backdrop auto-closes. Put Form with buttons inside children.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Modal", props, renderNode }),
});
