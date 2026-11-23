"use client";
import * as React from "react";

// Inside generated blocks, code reads as the surrounding text set in mono on
// a faint fill: no border and no syntax tint, so it never outweighs a title.
const code =
  "rounded-[var(--hui-radius-1)] bg-[color-mix(in_oklab,currentColor_7%,transparent)] px-[0.3em] py-px font-mono text-[0.88em] [box-decoration-break:clone]";

// Emphasis follows Markdown's flanking rule: the inside of a delimiter never
// touches a space, and a single * never sits against a letter or another *.
// So **bold** and *italic* render, while code-like text such as `int **pp`,
// `*p = 20; *q` or `a * b * c` stays as typed.
const emphasis = /\*\*(?=\S)([^*]+?)(?<=\S)\*\*|(?<![*\w])\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*(?![*\w])/g;

function Emphasis({ value }: { value: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of value.matchAll(emphasis)) {
    if (match.index > last) parts.push(value.slice(last, match.index));
    parts.push(
      match[1] !== undefined ? (
        <strong key={match.index} className="font-semibold">
          {match[1]}
        </strong>
      ) : (
        <em key={match.index}>{match[2]}</em>
      ),
    );
    last = match.index + match[0].length;
  }
  if (last < value.length) parts.push(value.slice(last));
  return <>{parts}</>;
}

/**
 * Generated text with Markdown's inline code, bold and italic rendered. Code
 * spans are found first, so nothing inside them is read as emphasis. Other
 * Markdown, and an unpaired delimiter, stays as typed.
 */
export function InlineText({ value }: { value: string }) {
  return value.split(/(`[^`]+`)/).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className={code}>
        {part.slice(1, -1)}
      </code>
    ) : (
      <Emphasis key={i} value={part} />
    ),
  );
}
