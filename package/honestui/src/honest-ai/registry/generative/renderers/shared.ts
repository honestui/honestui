import * as React from "react";

export type Props = Record<string, unknown>;
export function record(value: unknown): Props {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Props)
    : {};
}
export function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
export function nodeProps(value: unknown): Props {
  const item = record(value);
  return record(item.props ?? item);
}
export function text(value: unknown): string {
  return value == null ? "" : String(value);
}
/** Model-generated URLs are never used as script or data URLs. */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* Invalid model output has no link. */
  }
}

export type NumberFormat = "number" | "currency" | "percent";

/**
 * A number in the viewer's locale, or undefined when it is not a finite number.
 * Percent takes the percentage itself (5 → 5%). Currency shows cents below
 * 1,000 when the amount has them ($411.50) and drops them above, where they are
 * false precision in an estimate ($46,585); pass decimals to choose.
 */
export function formatNumber(
  value: unknown,
  format: NumberFormat = "number",
  decimals?: number,
  currency = "USD",
): string | undefined {
  if (value == null || value === "") return;
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  const fractionDigits =
    decimals ??
    (format === "currency"
      ? Number.isInteger(number) || Math.abs(number) >= 1000
        ? 0
        : 2
      : undefined);
  const options: Intl.NumberFormatOptions = {
    style: format === "number" ? "decimal" : format,
    minimumFractionDigits: fractionDigits ?? 0,
    maximumFractionDigits: fractionDigits ?? (format === "percent" ? 1 : 2),
  };
  const input = format === "percent" ? number / 100 : number;
  try {
    return new Intl.NumberFormat(undefined, {
      ...options,
      ...(format === "currency" ? { currency } : {}),
    }).format(input);
  } catch {
    // An unknown currency code still shows the amount.
    return new Intl.NumberFormat(undefined, { ...options, style: "decimal" }).format(input);
  }
}

/**
 * True inside a generated Card. Components that draw their own frame (Map,
 * Calculator, Quiz) drop it there, so the Card's edge is the only one.
 */
export const InsideCardContext = React.createContext(false);

/**
 * True inside a chat reply, where an action is one option among several and
 * the accent fill is kept for a form's submit.
 */
export const ChatReplyContext = React.createContext(false);

/**
 * True while any reply in the chat is running. A new message cannot start
 * then, so controls that send one show they are busy instead of looking
 * ready and doing nothing.
 */
export const ChatBusyContext = React.createContext(false);

/** Stop presses, per chat store, so a send with no reply can tell Stop from an empty answer. */
const stops = new WeakMap<object, boolean>();
export function noteStopped(chat: object | null) {
  if (chat) stops.set(chat, true);
}
export function takeStopped(chat: object | null): boolean {
  if (!chat) return false;
  const stopped = stops.get(chat) === true;
  stops.delete(chat);
  return stopped;
}

/** True when an action plan sends a message to the assistant. */
export function sendsMessage(action: unknown): boolean {
  const steps = (action as { steps?: { type?: string }[] } | null)?.steps;
  return !!steps?.some((step) => step.type === "continue_conversation");
}

/** A quiet "View data" or "Details" disclosure summary; pair it with DisclosureChevron. */
export const disclosureSummary =
  "-mx-1 flex min-h-6 w-fit cursor-pointer list-none items-center gap-1 rounded-[var(--hui-radius-1)] px-1 text-xs pointer-coarse:min-h-11 text-[var(--hui-color-foreground-base-secondary)] outline-none hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] [&::-webkit-details-marker]:hidden";
/** Rotates when its `group` details element opens. */
export const disclosureChevron =
  "size-3.5 shrink-0 motion-safe:transition-transform group-open:rotate-90";

/** A plain number as written by a model: 1200, -3.5 or "1200", not "$1,200". */
export function plainNumber(value: unknown): number | undefined {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())
        ? Number(value)
        : NaN;
  return Number.isFinite(number) ? number : undefined;
}

/**
 * A column of years: whole numbers a year could be, and a header that names
 * them ("Year", "Season", "Founded", but not a rate such as "Cost per year").
 * Where years are the likely axis (a table's first column, a scatter's x),
 * values alone may decide: at least two distinct, no more than 50 apart once
 * sorted (2022, 2023 or 1960, 1980, 2000). Elsewhere 1199, 1249, 1299 are
 * prices, not years.
 */
export function looksLikeYears(
  values: unknown[],
  label = "",
  { leading = false }: { leading?: boolean } = {},
): boolean {
  const present = values.filter((v) => v != null && v !== "");
  const numbers = present.map(plainNumber).filter((n) => n !== undefined);
  if (
    numbers.length === 0 ||
    numbers.length !== present.length ||
    !numbers.every((n) => Number.isInteger(n) && n >= 1000 && n <= 2100)
  )
    return false;
  // A header naming a unit or amount ("Price ($)", "Cost", "Share (%)")
  // says these are quantities, wherever they sit.
  const quantity = /[$€£¥%]|\b(price|cost|amount|revenue|total|count|salary|rent|fee)\b/i.test(label);
  // The header names years when it ends in a year word with nothing that
  // makes it a period of amounts: "Year", "Census year", "Season", but not
  // "This year", "Last year", "Year to date" or "Cost per year".
  // Digits stay words, so "Year 1" ends in "1" and is a projection, not years.
  const words = label.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const yearWords = ["year", "years", "season", "founded", "census", "vintage"];
  const yearWord = yearWords.includes(words.at(-1) ?? "");
  const mentionsYear = words.some((word) => yearWords.includes(word));
  const period = words.some((word) =>
    ["this", "last", "next", "per", "each", "a", "ytd", "to", "date", "end", "prior", "previous", "current"].includes(word),
  );
  const rate = /\/\s*(year|years|season)\b/i.test(label);
  if (yearWord && !period && !rate && !quantity) return true;
  if (!leading || rate || quantity || (mentionsYear && period)) return false;
  const distinct = [...new Set(numbers)].sort((a, b) => a - b);
  return (
    distinct.length >= 2 &&
    distinct.every((n, i) => i === 0 || n - distinct[i - 1] <= 50)
  );
}

/**
 * A header naming an identifier ("Order #", "Account number", "ZIP", "SKU"),
 * whose values stay as written. A count ("# of guests", "No. of rooms") is
 * not one.
 */
export function isIdentifierLabel(label: string): boolean {
  // "Units (#)", "Population (no.)": a trailing unit in brackets is a count.
  if (/\((#|no\.?|n)\)\s*$/i.test(label)) return false;
  const words = label.toLowerCase().split(/[\s()/:,-]+/).filter(Boolean);
  // "# of guests", "Lines of code", "Total number": how many, not which one.
  if (words.at(-2) === "of" || words.includes("of") && ["#", "no", "no.", "number"].includes(words[0]))
    return false;
  if (["total", "average", "mean", "max", "min"].includes(words.at(-2) ?? "")) return false;
  const last = words.at(-1) ?? "";
  return (
    ["number", "no", "no.", "#", "id", "ids", "ref", "code"].includes(last) ||
    words.some((word) => ["id", "zip", "postcode", "postal", "phone", "sku", "isbn"].includes(word))
  );
}

/**
 * A figure in a column of figures, with only its whole part grouped: 1200
 * reads as 1,200 and "3.1400" keeps every digit after the point. Years,
 * zero-padded codes ("0012") and formatted text ("$1,200", "12%") stay as
 * written.
 */
export function groupDigits(value: unknown, years = false): string {
  if (years || plainNumber(value) === undefined) return text(value);
  // A number never shows as 1e+21; one too small for 20 decimal places keeps
  // its scientific form (1e-21) rather than reading as 0.
  if (typeof value === "number")
    return value !== 0 && Math.abs(value) < 1e-20
      ? String(value)
      : value.toLocaleString(undefined, { maximumFractionDigits: 20 });
  const written = text(value).trim();
  if (/^-?0\d/.test(written)) return written;
  const [whole, fraction] = written.split(".");
  // The whole part goes through BigInt, never Number, so a value past
  // Number.MAX_SAFE_INTEGER keeps every digit, grouped the viewer's way.
  const grouped = BigInt(whole).toLocaleString();
  const point =
    new Intl.NumberFormat().formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? ".";
  const sign = whole === "-0" ? "-" : "";
  return fraction === undefined ? sign + grouped : `${sign}${grouped}${point}${fraction}`;
}
