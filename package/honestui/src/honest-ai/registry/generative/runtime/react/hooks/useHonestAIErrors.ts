// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import {
  enrichErrors,
  type HonestAIError,
  type ParseResult,
  type QuerySnapshot,
} from "../../core/index";
import { useEffect, useRef, useState } from "react";
import type { Library } from "../library";

type CurrentRef<T> = { current: T };

export interface HonestAIErrorsResult {
  errorsRef: CurrentRef<HonestAIError[]>;
  errorRevision: number;
}

export interface UseHonestAIErrorsOptions {
  response: string | null;
  isStreaming: boolean;
  result: ParseResult | null;
  evaluatedResult: ParseResult | null;
  library: Library;
  querySnapshot: QuerySnapshot;
  parseExceptionRef: CurrentRef<HonestAIError | null>;
  runtimeErrorsRef: CurrentRef<HonestAIError[]>;
  renderErrorsRef: CurrentRef<HonestAIError[]>;
  onError?: (errors: HonestAIError[]) => void;
}

/** Aggregates Renderer errors and owns the public onError callback behavior. */
export function useHonestAIErrors({
  response,
  isStreaming,
  result,
  evaluatedResult,
  library,
  querySnapshot,
  parseExceptionRef,
  runtimeErrorsRef,
  renderErrorsRef,
  onError,
}: UseHonestAIErrorsOptions): HonestAIErrorsResult {
  const errorsRef = useRef<HonestAIError[]>([]);
  const [errorRevision, setErrorRevision] = useState(0);
  const lastErrorKeyRef = useRef("");
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (isStreaming) {
      errorsRef.current = [];

      // Clear stale errors so correction-loop consumers receive a clean signal
      // while the next response is being generated.
      if (lastErrorKeyRef.current !== "") {
        lastErrorKeyRef.current = "";
        onErrorRef.current?.([]);
      }
      return;
    }

    const errors: HonestAIError[] = [];

    if (parseExceptionRef.current) {
      errors.push(parseExceptionRef.current);
    }

    // A missing or unusable entry is reported by the parser as `no-root`.
    if (response && !result?.meta.statementCount && !parseExceptionRef.current) {
      errors.push({
        source: "parser",
        code: "parse-failed",
        message: "Response could not be parsed as valid honestai-lang",
        hint: `The entire response must be valid honestai-lang code starting with root = ${library.root ?? "Root"}(...)`,
      });
    }

    // The stream has ended, so an open bracket or quote will never close.
    // Without this, everything after it would vanish without a word.
    if (response && result?.meta.incomplete) {
      errors.push({
        source: "parser",
        code: "incomplete",
        message:
          "The generated program ends with a bracket or quote left open, so the parts after it are missing.",
        hint: "Close every (, [, { and quote. Count the closing parentheses of nested calls such as @Each(..., @Sum(@Each(...))).",
      });
    }

    if (result?.meta.errors.length) {
      errors.push(
        ...enrichErrors(
          result.meta.errors,
          library.toJSONSchema(),
          Object.keys(library.components),
        ),
      );
    }

    errors.push(...runtimeErrorsRef.current);
    errors.push(...renderErrorsRef.current);
    renderErrorsRef.current = [];
    errors.push(...(querySnapshot.__honestai_errors ?? []));
    errorsRef.current = errors;

    const errorKey = JSON.stringify(errors);
    if (errorKey === lastErrorKeyRef.current) return;

    lastErrorKeyRef.current = errorKey;
    setErrorRevision((revision) => revision + 1);
    if (onErrorRef.current) {
      onErrorRef.current(errors);
    } else if (errors.length > 0) {
      for (const error of errors) {
        console.warn(`[honestai] ${error.source}/${error.code}: ${error.message}`);
      }
    }
  }, [
    isStreaming,
    response,
    result,
    evaluatedResult,
    querySnapshot,
    library,
    parseExceptionRef,
    runtimeErrorsRef,
    renderErrorsRef,
  ]);

  return { errorsRef, errorRevision };
}
