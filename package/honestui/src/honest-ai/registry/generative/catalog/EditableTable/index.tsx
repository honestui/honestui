"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import { EditableTableSchema } from "./schema";

export * from "./schema";

export const EditableTable = defineComponent({
  name: "EditableTable",
  props: EditableTableSchema,
  description:
    "Spreadsheet-like table whose cells the user can edit inline (text, number, url, date, select columns); edits are saved back as a form field",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "EditableTable",
      props,
      renderNode,
    }),
});
