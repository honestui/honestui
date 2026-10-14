"use client";
import * as React from "react";
import {
  FormValidationContext,
  useCreateFormValidation,
  useIsStreaming,
} from "../runtime/react";
import { LiveValidationContext } from "./fields";
import { InlineText } from "./inline-text";
import { cn } from "../../../lib/utils.js";
import { InsideCardContext, formatNumber, text, type NumberFormat, type Props } from "./shared";

type GeneratedProps = {
  props: Props;
  renderNode: (value: unknown) => React.ReactNode;
};

/** Whether the calculator's inputs pass their rules; false hides every result. */
const InputsValidContext = React.createContext(true);

// Long enough for a slider drag or a typed number to settle before speaking.
const ANNOUNCE_DELAY_MS = 600;

/**
 * Inputs beside the results they drive, with no submit step. The inputs share
 * one validation scope, as a Form's do, so their rules show inline errors, and
 * a result is withheld while any input fails rather than computed from it.
 */
export function GeneratedCalculator({ props, renderNode }: GeneratedProps) {
  const validation = useCreateFormValidation();
  // In a Card, the Card is the frame; the results become a tinted panel.
  const inCard = React.useContext(InsideCardContext);
  // Each input checks its own rules as its value changes (LiveValidationContext),
  // so a starting value that fails is flagged and a late-arriving one clears.
  const inputsValid = !Object.values(validation.errors).some(Boolean);

  return (
    <div
      data-frame={inCard ? undefined : ""}
      className={cn(
        "@container",
        !inCard &&
          "overflow-hidden rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)]",
      )}
    >
      <div className={cn("grid @2xl:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)]", inCard && "gap-5")}>
        <FormValidationContext.Provider value={validation}>
          <LiveValidationContext.Provider value>
            <div className={cn("grid content-start gap-5", !inCard && "p-5")}>
              {renderNode(props.inputs)}
              {renderNode(props.actions)}
            </div>
          </LiveValidationContext.Provider>
        </FormValidationContext.Provider>
        <InputsValidContext.Provider value={inputsValid}>
          <dl
            className={cn(
              "m-0 grid content-start gap-5 bg-[var(--hui-color-background-base-secondary)] p-5 [&>*:first-child]:[--result-size:2.25rem] [&>*:not(:first-child)_[data-slot=result-incomplete]]:hidden",
              inCard
                ? "rounded-[var(--hui-radius-2)]"
                : "border-t border-[var(--hui-color-border-base-primary)] @2xl:border-t-0 @2xl:border-l",
            )}
          >
            {renderNode(props.results)}
          </dl>
        </InputsValidContext.Provider>
      </div>
      {!!text(props.formula) && (
        <p
          className={cn(
            "m-0 border-t border-[var(--hui-color-border-base-primary)] text-sm text-muted-foreground",
            inCard ? "mt-5 pt-3" : "px-5 py-3",
          )}
        >
          <span className="font-medium text-[var(--hui-color-foreground-base-primary)]">
            {"How it's calculated: "}
          </span>
          <InlineText value={text(props.formula)} />
        </p>
      )}
    </div>
  );
}

const formats = new Set<NumberFormat>(["number", "currency", "percent"]);

/**
 * A polite live region that speaks a result after it settles, not every step
 * of a drag. It starts with the current text, so nothing is read on arrival.
 */
function Announcer({ text }: { text: string }) {
  const [announced, setAnnounced] = React.useState(text);
  React.useEffect(() => {
    const timer = setTimeout(() => setAnnounced(text), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);
  return (
    <span className="sr-only" aria-live="polite">
      {announced}
    </span>
  );
}

export function GeneratedResult({ props }: { props: Props }) {
  const inputsValid = React.useContext(InputsValidContext);
  const streaming = useIsStreaming();
  const label = text(props.label);
  const format = formats.has(props.format as NumberFormat)
    ? (props.format as NumberFormat)
    : "number";
  const value = inputsValid
    ? formatNumber(
        props.value,
        format,
        typeof props.decimals === "number" ? props.decimals : undefined,
        text(props.currency) || undefined,
      )
    : undefined;
  const explanation = !inputsValid
    ? "Complete the inputs to see this result."
    : value === undefined
      ? "This can't be calculated from these inputs."
      : text(props.detail);

  return (
    <div className="grid gap-1">
      <dt className="text-sm text-muted-foreground">
        {label}
        {/* Mounted once the reply is complete, so the finished stream is not read out. */}
        {!streaming && <Announcer text={`${label}: ${value ?? explanation}`} />}
      </dt>
      <dd
        className="m-0 text-[length:var(--result-size,1.5rem)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]"
        aria-hidden={value === undefined || undefined}
      >
        {value ?? "—"}
      </dd>
      {!!explanation && (
        <dd
          data-slot={inputsValid ? undefined : "result-incomplete"}
          className="m-0 text-sm text-muted-foreground"
        >
          {explanation}
        </dd>
      )}
    </div>
  );
}
