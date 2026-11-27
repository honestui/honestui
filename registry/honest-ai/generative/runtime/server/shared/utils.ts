// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { ParseResult } from "../../core/index";
import type { AutofixDiagnostic, BaseAutofixInput } from "./types";


// Collect parser errors, missing references, and incomplete output into diagnostics.
// Warnings (the program still renders) are not errors and never trigger a fix.
export function errorsOf({ root, rootExpression, meta }: ParseResult): AutofixDiagnostic[] {
  return [
    ...meta.errors.filter((error) => error.severity !== "warning"),
    ...meta.unresolved.map((name) => ({
      code: "unresolved",
      statementId: name,
      message: `Reference "${name}" is not defined`,
    })),
    ...meta.orphaned.map((name) => ({
      code: "orphaned",
      statementId: name,
      message: `Statement "${name}" is not reachable from root`,
    })),
    ...(meta.incomplete ? [{ code: "incomplete", message: "Generation ends mid-statement" }] : []),
    ...(root === null && !rootExpression
      ? [{ code: "missing-root", message: "No root element" }]
      : []),
  ];
}

/** Keep recent text context within the repair context budget of 20 messages and 8,000 characters. */
export function repairContext(messages: NonNullable<BaseAutofixInput["messages"]>) {
  const context: { role: "user" | "assistant" | "system" | "developer"; content: string }[] = [];
  let remaining = 8_000;
  for (let i = messages.length - 1; i >= 0 && context.length < 20 && remaining > 0; i--) {
    const message = messages[i]!;
    if (!["user", "assistant", "system", "developer"].includes(message.role)) continue;
    const text =
      typeof message.content === "string"
        ? message.content
        : (message.content ?? []).map((part) => (part.type === "text" ? part.text : "")).join("\n");
    if (!text) continue;
    const content = text.slice(-remaining);
    context.unshift({ role: message.role as (typeof context)[number]["role"], content });
    remaining -= content.length;
  }
  return context;
}

const HONESTAI_FENCE = /```honestai(?:-lang)?\s*\n/;
const ROOT_ASSIGN = /(^|\n)\s*root\s*=/;
const CONTENT_OPEN = "]]>honestai:content";
const CONTENT_END = "]]>honestai:end";
const FENCE_CLOSE = "```";
const FENCE_CLOSE_WITH_END = "```\n]]>honestai:end";

/** Honest AI Lang is a application content marker, a fenced ```honestai block, or an unfenced `root =` program. */
export function isUIOutput(text: string): boolean {
  return text.includes(CONTENT_OPEN) || text.search(HONESTAI_FENCE) >= 0 || ROOT_ASSIGN.test(text);
}

/** Split a closed HonestAI block from its closer (```, or ``` plus ]]>honestai:end). */
export function splitClosedFence(text: string): { body: string; closing: string } | null {
  const fence = text.search(HONESTAI_FENCE);
  const content = text.indexOf(CONTENT_OPEN);
  const open = fence >= 0 ? fence : content;
  if (open < 0) return null;
  const afterOpenNl = text.indexOf("\n", open);
  if (afterOpenNl < 0) return null;
  const from = afterOpenNl + 1;
  // Prefer the application closer so a later repair stays inside ]]>honestai:content … end.
  if (content >= 0) {
    const closeWithEnd = text.indexOf(FENCE_CLOSE_WITH_END, from);
    if (closeWithEnd >= 0)
      return { body: text.slice(0, closeWithEnd), closing: text.slice(closeWithEnd) };
    const closeEnd = text.indexOf(CONTENT_END, from);
    if (closeEnd >= 0) return { body: text.slice(0, closeEnd), closing: text.slice(closeEnd) };
    // Fence is open but ]]>honestai:end has not arrived; hold a bare ``` if present.
    if (fence < 0) return null;
  }
  const close = text.indexOf(FENCE_CLOSE, from);
  if (close < 0) return null;
  return { body: text.slice(0, close), closing: text.slice(close) };
}

/** Inner HonestAI program, without a wrapping markdown fence or application markers. */
export function unwrapHonestAIFence(text: string): string {
  const fence = text.search(HONESTAI_FENCE);
  if (fence >= 0) {
    const start = text.indexOf("\n", fence) + 1;
    const close = text.indexOf("```", start);
    return (close < 0 ? text.slice(start) : text.slice(start, close)).trim();
  }
  const content = text.indexOf(CONTENT_OPEN);
  if (content < 0) return text;
  const start = text.indexOf("\n", content) + 1;
  const close = text.indexOf(CONTENT_END, start);
  return (close < 0 ? text.slice(start) : text.slice(start, close)).trim();
}
