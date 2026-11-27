"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { QuizQuestionSchema } from "./schema";

export { QuizQuestionSchema } from "./schema";

export const QuizQuestion = defineComponent({
  name: "QuizQuestion",
  props: QuizQuestionSchema,
  description:
    "One single-answer question. answer must be the exact text of one option. explanation says why that answer is right, in one or two sentences.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "QuizQuestion", props, renderNode }),
});

export const Quiz = defineComponent({
  name: "Quiz",
  props: z.object({ questions: z.array(QuizQuestion.ref) }),
  description:
    "Multiple-choice questions with known answers, shown one at a time. The user can change answers until they submit at the end; then the browser scores them and shows each right answer with its explanation, Try again, and an offer to explain missed questions.",
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Quiz", props, renderNode }),
});
