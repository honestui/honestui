"use client";
import * as React from "react";
import { Check as CheckIcon, X as XIcon } from "honestui/icons";
import { Button } from "../../../components/ui/button.js";
import { Radio, RadioGroup } from "../../../components/ui/radio-group.js";
import { cn } from "../../../lib/utils.js";
import { useIsStreaming, useTriggerAction } from "../runtime/react";
import { InlineText } from "./inline-text";
import { InsideCardContext, array, nodeProps, text, type Props } from "./shared";

type Question = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  /** False when the answer is not one of the options, so it cannot be marked. */
  gradable: boolean;
};

function readQuestions(value: unknown): Question[] {
  // While a reply streams, a question may arrive before its options.
  return array(value)
    .map(nodeProps)
    .filter((item) => text(item.question))
    .map((item) => {
      const options = array(item.options).map(text).filter(Boolean);
      const answer = text(item.answer);
      return {
        question: text(item.question),
        options,
        answer,
        explanation: text(item.explanation),
        gradable: options.includes(answer),
      };
    });
}

/** The quiz's own frame, or none inside a Card, whose edge and padding take over. */
function frameClasses(inCard: boolean) {
  return {
    frame: inCard
      ? ""
      : "overflow-hidden rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)]",
    pad: inCard ? "" : "px-5",
    footer: cn(
      "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hui-color-border-base-primary)]",
      inCard ? "pt-3" : "bg-[var(--hui-color-background-base-secondary)] px-5 py-3",
    ),
  };
}

/**
 * Questions with known answers, one at a time. Answers can change until the
 * reader submits; only then are they marked, scored and explained. The answer
 * key comes from the reply itself, and the reader's choices stay on the page
 * unless they ask the assistant to explain what they missed.
 */
export function GeneratedQuiz({ props }: { props: Props }) {
  const streaming = useIsStreaming();
  const trigger = useTriggerAction();
  const questions = readQuestions(props.questions);
  const [chosen, setChosen] = React.useState<Record<number, string>>({});
  const [step, setStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [needsAnswer, setNeedsAnswer] = React.useState(false);
  const focusPending = React.useRef(false);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const hintId = React.useId();
  const { frame, pad, footer } = frameClasses(React.useContext(InsideCardContext));

  // After a step or a submit, the new heading takes focus, so a screen reader
  // announces where the reader now is.
  React.useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    heading.current?.focus();
  });

  if (questions.length === 0) return null;

  const current = Math.min(step, questions.length - 1);
  const isLast = current === questions.length - 1;
  const scored = questions.filter((item) => item.gradable);
  const correct = questions.filter((item, i) => item.gradable && chosen[i] === item.answer).length;
  const missed = questions
    .map((item, i) => ({ item, choice: chosen[i] }))
    .filter(({ item, choice }) => item.gradable && choice !== item.answer);

  const goTo = (next: number) => {
    setNeedsAnswer(false);
    setStep(next);
    focusPending.current = true;
  };
  const forward = () => {
    if (chosen[current] === undefined) {
      setNeedsAnswer(true);
      return;
    }
    if (isLast) {
      setSubmitted(true);
      focusPending.current = true;
    } else goTo(current + 1);
  };
  const tryAgain = () => {
    setChosen({});
    setSubmitted(false);
    goTo(0);
  };
  const explainMissed = () =>
    trigger("Explain the quiz questions I missed", undefined, {
      steps: [
        {
          type: "continue_conversation",
          message: "Explain the quiz questions I missed",
          context: missed.map(({ item, choice }) => ({
            question: item.question,
            chosen: choice,
            answer: item.answer,
          })),
        },
      ],
    });

  if (submitted) {
    return (
      <div data-frame={frame ? "" : undefined} className={frame}>
        <div className={cn("grid gap-1 border-b border-[var(--hui-color-border-base-primary)] pb-4", pad, !!pad && "pt-4")}>
          {/* data-slot opts out of the site's page-heading size for bare h2s. */}
          <h2 ref={heading} tabIndex={-1} data-slot="quiz-score" className="m-0 text-2xl font-semibold tracking-tight outline-none">
            {scored.length > 0 ? `${correct} of ${scored.length} correct` : "Answers submitted"}
          </h2>
          <p className="m-0 text-sm text-muted-foreground">
            {scored.length > 0 && missed.length === 0
              ? "You got every question right."
              : "Review each answer below."}
          </p>
        </div>
        <ol className={cn("m-0 grid list-none gap-7 py-5", pad)}>
          {questions.map((item, i) => (
            <li key={i}>
              <QuestionView
                number={i + 1}
                total={questions.length}
                question={item}
                choice={chosen[i]}
                reviewing
              />
            </li>
          ))}
        </ol>
        <div className={cn(footer, "justify-end")}>
          {missed.length > 0 && (
            <Button variant="secondary" size="sm" onClick={explainMissed}>
              Explain what I missed
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={tryAgain}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const answered = questions.filter((_, i) => chosen[i] !== undefined).length;
  return (
    <div data-frame={frame ? "" : undefined} className={frame}>
      <div className={cn("grid gap-2", pad, !!pad && "pt-4")}>
        <p className="m-0 text-sm text-muted-foreground" aria-hidden="true">
          Question {current + 1} of {questions.length}
        </p>
        <div
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answered}
          className="h-1 overflow-hidden rounded-full bg-[var(--hui-color-background-neutral-secondary)]"
        >
          <div
            className="h-full rounded-full bg-[var(--hui-color-background-accent-emphasis)] motion-safe:transition-[width] motion-safe:duration-200"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <div className={cn("py-5", pad)}>
        <QuestionView
          key={current}
          number={current + 1}
          total={questions.length}
          question={questions[current]}
          choice={chosen[current]}
          headingRef={heading}
          disabled={streaming}
          describedBy={needsAnswer ? hintId : undefined}
          onChoose={(choice) => {
            setNeedsAnswer(false);
            setChosen((previous) => ({ ...previous, [current]: choice }));
          }}
        />
      </div>
      <div className={footer}>
        <p id={hintId} className="m-0 text-sm" aria-live="polite">
          {needsAnswer ? (isLast ? "Choose an answer to submit." : "Choose an answer to continue.") : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {current > 0 && (
            <Button variant="ghost" size="sm" onClick={() => goTo(current - 1)}>
              Back
            </Button>
          )}
          {/* The last questions may still be arriving. */}
          <Button size="sm" onClick={forward} disabled={streaming && isLast}>
            {isLast ? "Submit answers" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionView({
  number,
  total,
  question,
  choice,
  reviewing = false,
  disabled = false,
  headingRef,
  describedBy,
  onChoose,
}: {
  number: number;
  total: number;
  question: Question;
  choice: string | undefined;
  /** After submitting: answers are marked and locked. */
  reviewing?: boolean;
  disabled?: boolean;
  headingRef?: React.Ref<HTMLHeadingElement>;
  describedBy?: string;
  onChoose?: (choice: string) => void;
}) {
  const id = React.useId();
  const isRight = question.gradable && choice === question.answer;

  return (
    <div className="grid gap-3">
      <h2
        ref={headingRef}
        id={`${id}-question`}
        data-slot="quiz-question"
        tabIndex={headingRef ? -1 : undefined}
        className="m-0 text-base font-medium outline-none"
      >
        <span className="sr-only">{`Question ${number} of ${total}: `}</span>
        {reviewing && <span aria-hidden="true">{number}. </span>}
        <InlineText value={question.question} />
      </h2>
      <RadioGroup
        aria-labelledby={`${id}-question`}
        aria-describedby={reviewing ? `${id}-feedback` : describedBy}
        value={choice ?? ""}
        onValueChange={(value) => {
          if (!reviewing) onChoose?.(String(value));
        }}
        // In review the answers are locked but still focusable and read out.
        // Base UI's readOnly puts aria-readonly on each radio, where ARIA does
        // not allow it, so the group carries it and changes are ignored above.
        aria-readonly={reviewing || undefined}
        disabled={disabled}
        className="gap-2"
      >
        {question.options.map((option, j) => {
          const isAnswer = reviewing && question.gradable && option === question.answer;
          const isWrongChoice = reviewing && question.gradable && option === choice && !isAnswer;
          return (
            <label
              key={j}
              className={cn(
                "flex items-center gap-3 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] px-3 py-2.5",
                !reviewing && "cursor-pointer hover:bg-[var(--hui-color-background-base-secondary)]",
                reviewing && !isAnswer && !isWrongChoice && "text-muted-foreground",
                isAnswer &&
                  "border-[var(--hui-color-foreground-success-primary)] bg-[var(--hui-color-background-success-primary)]",
                isWrongChoice &&
                  "border-[var(--hui-color-border-danger-primary)] bg-[var(--hui-color-background-danger-primary)]",
              )}
            >
              <Radio
                value={option}
                // The radio is a span, which the wrapping label does not name.
                aria-labelledby={`${id}-option-${j}`}
                aria-describedby={isAnswer || isWrongChoice ? `${id}-mark-${j}` : undefined}
                className={cn(reviewing && "cursor-default")}
              />
              <span id={`${id}-option-${j}`} className="min-w-0 flex-1">
                <InlineText value={option} />
              </span>
              {isAnswer && (
                <span id={`${id}-mark-${j}`} className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <CheckIcon aria-hidden="true" className="size-4" />
                  {choice === option ? "Your answer" : "Answer"}
                </span>
              )}
              {isWrongChoice && (
                <span id={`${id}-mark-${j}`} className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <XIcon aria-hidden="true" className="size-4" />
                  Your answer
                </span>
              )}
            </label>
          );
        })}
      </RadioGroup>
      {reviewing && (
        <p id={`${id}-feedback`} className="m-0 text-sm">
          {!question.gradable ? (
            "This question has no answer key, so it isn't scored."
          ) : (
            <>
              <strong className="font-semibold">
                {isRight ? (
                  "Correct."
                ) : (
                  <>
                    Not quite. The answer is <InlineText value={question.answer} />.
                  </>
                )}
              </strong>
              {question.explanation && (
                <>
                  {" "}
                  <InlineText value={question.explanation} />
                </>
              )}
            </>
          )}
        </p>
      )}
    </div>
  );
}
