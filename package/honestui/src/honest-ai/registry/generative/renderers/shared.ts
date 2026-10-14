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
