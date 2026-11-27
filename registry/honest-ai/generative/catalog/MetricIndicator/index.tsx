"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { defineComponent } from "../../runtime/react/index";

import {
  MetricIndicatorInlineSchema,
  MetricIndicatorWithStrikethroughSchema,
} from "./schema";

export * from "./schema";

export const MetricIndicatorWithStrikethrough = defineComponent({
  name: "MetricIndicatorWithStrikethrough",
  props: MetricIndicatorWithStrikethroughSchema,
  description:
    "Headline metric value with an optional struck-through previousValue, a +/- percentage trend, and subtext below.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "MetricIndicatorWithStrikethrough",
      props,
      renderNode,
    }),
});

export const MetricIndicatorInline = defineComponent({
  name: "MetricIndicatorInline",
  props: MetricIndicatorInlineSchema,
  description:
    "Headline metric value with an optional +/- percentage trend and subtext, all on one line.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, {
      name: "MetricIndicatorInline",
      props,
      renderNode,
    }),
});
