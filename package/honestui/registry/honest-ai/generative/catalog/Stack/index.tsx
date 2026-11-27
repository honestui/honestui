"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";
import { StackSchema } from "./schema";

export { StackSchema } from "./schema";

export const Stack = defineComponent({
  name: "Stack",
  props: StackSchema,
  description:
    'Flex container. direction: "row"|"column" (default "column"). gap: "none"|"xs"|"s"|"m"|"l"|"xl"|"2xl" (default "m"). align: "start"|"center"|"end"|"stretch"|"baseline". justify: "start"|"center"|"end"|"between"|"around"|"evenly".',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Stack", props, renderNode }),
});
