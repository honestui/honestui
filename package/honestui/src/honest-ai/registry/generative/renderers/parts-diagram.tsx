"use client";
import * as React from "react";
import { LiteralValue, diagramCanvas, diagramCaption } from "./diagram";
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

// The same raised surface as a diagram's boxes.
const surface =
  "border border-[var(--hui-color-border-base-primary)] bg-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_3%,var(--hui-color-background-base-primary))]";

/**
 * Parts side by side, as one bar with each label under its segment, both
 * starting at the same inset so the column reads as one. Narrow, or with many
 * parts, each part becomes a line: its value beside its label.
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
            className={`${surface} flex min-h-9 max-w-full min-w-0 shrink-0 items-center rounded-[var(--hui-radius-2)] px-3 py-1.5 text-sm break-words @2xl:group-data-[layout=bar]/row:min-h-11 @2xl:group-data-[layout=bar]/row:w-full @2xl:group-data-[layout=bar]/row:rounded-none @2xl:group-data-[layout=bar]/row:border-l-0 @2xl:group-data-[layout=bar]/row:py-2.5 @2xl:group-data-[layout=bar]/row:group-first/part:rounded-l-[var(--hui-radius-2)] @2xl:group-data-[layout=bar]/row:group-first/part:border-l @2xl:group-data-[layout=bar]/row:group-last/part:rounded-r-[var(--hui-radius-2)]`}
          >
            {part.value ? (
              <LiteralValue value={part.value} />
            ) : (
              <span className="min-w-0 font-medium">
                <InlineText value={part.label} />
              </span>
            )}
          </span>
          <span className="grid min-w-0 gap-0.5 pt-[7px] break-words @2xl:group-data-[layout=bar]/row:px-3 @2xl:group-data-[layout=bar]/row:pt-0">
            {!!part.value && (
              <span className="text-[13px] font-medium">
                <InlineText value={part.label} />
              </span>
            )}
            {!!part.detail && (
              <span className="text-[13px] text-pretty text-muted-foreground">
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
          className="grid gap-1 border border-t-0 border-[var(--hui-color-border-base-primary)] bg-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_3%,var(--hui-color-background-base-primary))] px-4 py-3 text-sm break-words first:rounded-t-[var(--hui-radius-2)] first:border-t last:rounded-b-[var(--hui-radius-2)] @xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] @xl:items-baseline @xl:gap-4"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="font-medium">
              <InlineText value={part.label} />
            </span>
            {!!part.value && (
              <LiteralValue value={part.value} className="text-muted-foreground" />
            )}
          </span>
          {!!part.detail && (
            <span className="text-pretty text-muted-foreground">
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
      className={`grid gap-3 rounded-[var(--hui-radius-2)] border px-4 py-3 break-words ${
        depth % 2 === 0
          ? "border-[var(--hui-color-border-base-primary)] bg-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_3%,var(--hui-color-background-base-primary))]"
          : "border-dashed border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-secondary)]"
      }`}
    >
      <span className="grid gap-0.5 text-sm">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="font-medium">
            <InlineText value={part.label} />
          </span>
          {!!part.value && <LiteralValue value={part.value} className="text-muted-foreground" />}
        </span>
        {!!part.detail && (
          <span className="text-pretty text-muted-foreground">
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
    <figure className="@container m-0 grid gap-2">
      <div className={diagramCanvas}>
        {arrangement === "row" && <RowParts parts={parts} />}
        {arrangement === "stack" && <StackParts parts={parts} />}
        {arrangement === "nested" && (
          <ul className="m-0 list-none p-0">
            <NestedParts parts={parts} />
          </ul>
        )}
      </div>
      {!!caption && (
        <figcaption className={diagramCaption}>
          <InlineText value={caption} />
        </figcaption>
      )}
    </figure>
  );
}
