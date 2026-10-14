"use client";
// Calculation functions for generated programs. MIT; see ./LICENSE.
import { z } from "zod/v4";
import { formatNumber } from "../renderers/shared";
import { defineFunction } from "../runtime/react/index";

// Bounds the work one expression can ask for. A simulation sums up to this
// many draws; a table or chart should show far fewer rows than this.

// Inputs bind text ("10"), and the runtime checks arguments against the JSON
// schema before a function runs, so numeric parameters accept numeric text.
const numeric = () => z.union([z.number(), z.string()]);
const MAX_RANGE = 10_000;

export const Pow = defineFunction({
  name: "Pow",
  description: "base raised to exponent, e.g. compound growth (1 + rate) ^ years",
  params: z.object({ base: numeric(), exponent: numeric() }),
  returns: z.number(),
  fn: ({ base, exponent }) => Math.pow(Number(base), Number(exponent)),
});

export const Format = defineFunction({
  name: "Format",
  description:
    'A number as text in the reader\'s locale: "number" (default), "currency" (code defaults to "USD") or "percent" (5 shows 5%). Shows "—" when the number cannot be calculated.',
  params: z.object({
    // Kept raw, so an empty input shows "—" rather than becoming 0.
    number: numeric().nullable(),
    format: z.enum(["number", "currency", "percent"]).optional(),
    decimals: numeric().optional(),
    currency: z.string().optional(),
  }),
  returns: z.string(),
  fn: ({ number, format, decimals, currency }) =>
    formatNumber(
      number,
      format,
      decimals === undefined ? undefined : Number(decimals),
      currency,
    ) ?? "—",
});

export const Range = defineFunction({
  name: "Range",
  description: `Whole numbers from start to end inclusive, by step (default 1), at most ${MAX_RANGE}, so bound any input that sets end to ${MAX_RANGE}. Use with @Each for one row or label per year, or with @Sum to count simulated trials.`,
  params: z.object({
    start: numeric(),
    end: numeric(),
    step: numeric().optional(),
  }),
  returns: z.array(z.number()),
  fn: ({ start, end, step }) => {
    const from = Number(start);
    const to = Number(end);
    const by = Number(step) > 0 ? Number(step) : 1;
    const values: number[] = [];
    if (!Number.isFinite(from) || !Number.isFinite(to)) return values;
    for (let n = from; n <= to && values.length < MAX_RANGE; n += by) values.push(n);
    return values;
  },
});

/** FNV-1a over the seed's JSON, so any seed, including a list, picks a stream. */
function hashSeed(seed: unknown): number {
  const source = JSON.stringify(seed) ?? "null";
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32: one well-mixed draw in [0, 1) from a 32-bit state. */
function draw(state: number): number {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * A seeded draw. The same seed gives the same number on every render and in
 * every browser, so a result never changes underneath the reader; a new draw
 * needs a new seed, such as a $run that a button increments. Not for security.
 */
export const Random = defineFunction({
  name: "Random",
  description:
    'A repeatable random draw: the same seed always gives the same number. With min and max, a whole number from min to max inclusive; without them, a fraction from 0 up to 1. Draw again by changing the seed (a button with @Set($run, $run + 1)); for many draws use a list seed such as [$run, t, "car"].',
  params: z.object({ seed: z.any(), min: numeric().optional(), max: numeric().optional() }),
  returns: z.number(),
  fn: ({ seed, min, max }) => {
    const fraction = draw(hashSeed(seed));
    if (min === undefined || max === undefined) return fraction;
    const low = Math.ceil(Math.min(Number(min), Number(max)));
    const high = Math.floor(Math.max(Number(min), Number(max)));
    return low + Math.floor(fraction * (high - low + 1));
  },
});

export const calculationFunctions = [Pow, Format, Range, Random];
