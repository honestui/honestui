"use client";
import * as React from "react";
import { InlineText } from "./inline-text";
import { array, nodeProps, text, type Props } from "./shared";

type Part = { label: string; value: string; detail: string; size: number };

type Arrangement = "row" | "stack" | "nested";

// Past this many parts a single bar is too cramped to read, so the row is
// drawn as lines instead. Every part is always shown.
const MAX_BAR_PARTS = 8;

function readParts(value: unknown): Part[] {
  const parts: Part[] = [];
  // While a reply streams, later parts may not have arrived yet.
  for (const item of array(value)) {
    const part = nodeProps(item);
    if (!text(part.label)) break;
    const size = Number(part.size);
    parts.push({
      label: text(part.label),
      value: text(part.value),
      detail: text(part.detail),
      size: Number.isFinite(size) && size > 0 ? size : 1,
    });
  }
  return parts;
}

const surface =
  "border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]";

function Value({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`font-mono font-medium [overflow-wrap:anywhere] ${className ?? ""}`}>
      {value}
    </span>
  );
}

/**
 * Parts side by side, as one bar with each label under its segment. Narrow, or
 * with many parts, each part becomes a line: its value beside its label.
 */
function RowParts({ parts }: { parts: Part[] }) {
  const asBar = parts.length <= MAX_BAR_PARTS;
  const columns = parts.map((part) => `minmax(0, ${part.size}fr)`).join(" ");
  return (
    <ol
      data-layout={asBar ? "bar" : "lines"}
      // As lines, a shared value column lines every label up; as a bar, each
      // part takes its share of the width.
      className="group/row m-0 grid list-none grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 p-0 @2xl:data-[layout=bar]:grid-cols-[var(--parts-columns)] @2xl:data-[layout=bar]:gap-0"
      style={{ "--parts-columns": columns } as React.CSSProperties}
    >
      {parts.map((part, i) => (
        <li key={i} className="group/part col-span-2 grid min-w-0 grid-cols-subgrid items-start @2xl:group-data-[layout=bar]/row:col-span-1 @2xl:group-data-[layout=bar]/row:flex @2xl:group-data-[layout=bar]/row:flex-col @2xl:group-data-[layout=bar]/row:gap-2">
          <span
            className={`${surface} flex min-h-9 shrink-0 items-center justify-start @2xl:group-data-[layout=bar]/row:justify-center rounded-[var(--hui-radius-2)] px-3 py-1.5 text-sm @2xl:group-data-[layout=bar]/row:min-h-14 @2xl:group-data-[layout=bar]/row:w-full @2xl:group-data-[layout=bar]/row:rounded-none @2xl:group-data-[layout=bar]/row:border-l-0 @2xl:group-data-[layout=bar]/row:px-2 @2xl:group-data-[layout=bar]/row:group-first/part:rounded-l-[var(--hui-radius-2)] @2xl:group-data-[layout=bar]/row:group-first/part:border-l @2xl:group-data-[layout=bar]/row:group-last/part:rounded-r-[var(--hui-radius-2)]`}
          >
            <Value value={part.value || part.label} />
          </span>
          <span className="grid min-w-0 gap-0.5 pt-1.5 @2xl:group-data-[layout=bar]/row:pt-0 @2xl:group-data-[layout=bar]/row:pr-3">
            {/* The accent tick ties a label to the segment above it. */}
            <span
              aria-hidden="true"
              className="mb-1 hidden h-0.5 w-6 rounded-full bg-[var(--hui-color-foreground-accent-primary)] @2xl:group-data-[layout=bar]/row:block"
            />
            {!!part.value && (
              <span className="text-sm font-medium">
                <InlineText value={part.label} />
              </span>
            )}
            {!!part.detail && (
              <span className="text-sm text-muted-foreground">
                <InlineText value={part.detail} />
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Layers, top first, as one column of bands. */
function StackParts({ parts }: { parts: Part[] }) {
  return (
    <ol className="m-0 list-none p-0">
      {parts.map((part, i) => (
        <li
          key={i}
          className="grid gap-1 border border-t-0 border-[var(--hui-color-border-base-primary)] px-4 py-3 first:rounded-t-[var(--hui-radius-2)] first:border-t last:rounded-b-[var(--hui-radius-2)] even:bg-[var(--hui-color-background-base-secondary)] @xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] @xl:items-baseline @xl:gap-4"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="font-medium">
              <InlineText value={part.label} />
            </span>
            {!!part.value && <Value value={part.value} className="text-sm" />}
          </span>
          {!!part.detail && (
            <span className="text-sm text-muted-foreground">
              <InlineText value={part.detail} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Each part inside the one before. Real nested lists carry the containment to
 * screen readers; each inner list is named for the part that holds it.
 */
function NestedParts({ parts, depth = 0 }: { parts: Part[]; depth?: number }) {
  const part = parts[depth];
  const inner = depth + 1 < parts.length;
  return (
    <li
      className={`grid gap-3 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] p-3 @md:p-4 ${
        depth % 2 === 0
          ? "bg-[var(--hui-color-background-base-secondary)]"
          : "bg-[var(--hui-color-background-base-primary)]"
      }`}
    >
      <span className={`grid gap-0.5 ${inner ? "" : "justify-items-center py-3 text-center"}`}>
        <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">
            <InlineText value={part.label} />
          </span>
          {!!part.value && inner && <Value value={part.value} />}
        </span>
        {!!part.value && !inner && <Value value={part.value} className="text-xl" />}
        {!!part.detail && (
          <span className="text-sm text-muted-foreground">
            <InlineText value={part.detail} />
          </span>
        )}
      </span>
      {inner && (
        <ul className="m-0 list-none p-0" aria-label={`Inside ${part.label.replaceAll("`", "")}`}>
          <NestedParts parts={parts} depth={depth + 1} />
        </ul>
      )}
    </li>
  );
}

export function GeneratedPartsDiagram({ props }: { props: Props }) {
  const arrangement: Arrangement =
    props.arrangement === "stack" || props.arrangement === "nested" ? props.arrangement : "row";
  const parts = readParts(props.parts);
  if (parts.length === 0) return null;
  const caption = text(props.caption);
  return (
    <figure className="@container m-0 grid gap-3">
      {arrangement === "row" && <RowParts parts={parts} />}
      {arrangement === "stack" && <StackParts parts={parts} />}
      {arrangement === "nested" && (
        <ul className="m-0 list-none p-0">
          <NestedParts parts={parts} />
        </ul>
      )}
      {!!caption && (
        <figcaption className="text-sm text-muted-foreground">
          <InlineText value={caption} />
        </figcaption>
      )}
    </figure>
  );
}
