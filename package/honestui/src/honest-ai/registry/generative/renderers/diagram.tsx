"use client";
import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { InlineText } from "./inline-text";
import { array, nodeProps, text, type Props } from "./shared";

/**
 * Container-query classes for the side-by-side layout. Each set turns on at a
 * width where that many boxes and their arrows still fit; below it, and for
 * longer chains, the boxes stack in a readable column and the arrows point down. Tailwind needs the
 * class names written out, so each set is spelled in full.
 */
const sideBySide = {
  md: {
    list: "@md:max-w-none @md:flex-row",
    node: "@md:flex-1 @md:basis-0",
    connector: "@md:flex @md:w-28 @md:shrink-0 @md:flex-col-reverse @md:items-center @md:justify-center @md:gap-1",
    arrow: "@md:w-full @md:flex-row",
    line: "@md:h-0 @md:w-auto @md:flex-1 @md:border-l-0 @md:border-t-2",
    head: "@md:mt-0 @md:-ml-[9px] @md:-rotate-90",
    label: "@md:text-center",
  },
  "2xl": {
    list: "@2xl:max-w-none @2xl:flex-row",
    node: "@2xl:flex-1 @2xl:basis-0",
    connector: "@2xl:flex @2xl:w-28 @2xl:shrink-0 @2xl:flex-col-reverse @2xl:items-center @2xl:justify-center @2xl:gap-1",
    arrow: "@2xl:w-full @2xl:flex-row",
    line: "@2xl:h-0 @2xl:w-auto @2xl:flex-1 @2xl:border-l-0 @2xl:border-t-2",
    head: "@2xl:mt-0 @2xl:-ml-[9px] @2xl:-rotate-90",
    label: "@2xl:text-center",
  },
};

function layoutFor(count: number) {
  if (count <= 2) return sideBySide.md;
  if (count === 3) return sideBySide["2xl"];
  return undefined;
}

/**
 * A chain of boxes joined by labeled arrows. The boxes are an ordered list, and
 * each one names its outgoing arrow for screen readers, so the drawn arrows are
 * hidden from assistive technology. Lines are borders and the arrowhead uses
 * currentColor, so both stay visible in forced colors.
 */
export function GeneratedDiagram({ props }: { props: Props }) {
  // While a reply streams, later nodes may not have arrived yet.
  const nodes: Props[] = [];
  for (const value of array(props.nodes)) {
    const node = nodeProps(value);
    if (!text(node.title)) break;
    nodes.push(node);
  }
  if (nodes.length === 0) return null;
  const arrows = array(props.arrows).map(text);
  const layout = layoutFor(nodes.length);
  const caption = text(props.caption);

  return (
    <figure className="@container m-0 grid gap-3">
      <ol className={cn("m-0 mx-auto flex w-full max-w-md list-none flex-col p-0", layout?.list)}>
        {nodes.map((node, i) => {
          const next = nodes[i + 1];
          const label = arrows[i] ?? "";
          return (
            <React.Fragment key={i}>
              <li className={cn("flex min-w-0", layout?.node)}>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] px-4 py-4 text-center">
                  <strong className="text-sm font-semibold">
                    <InlineText value={text(node.title)} />
                  </strong>
                  {!!text(node.value) && (
                    <span className="font-mono text-2xl font-semibold [overflow-wrap:anywhere]">
                      {text(node.value)}
                    </span>
                  )}
                  {!!text(node.detail) && (
                    <span className="text-sm text-muted-foreground">
                      <InlineText value={text(node.detail)} />
                    </span>
                  )}
                </div>
                {next && (
                  <span className="sr-only">
                    {label ? <InlineText value={label} /> : "Leads to"}{" "}
                    <InlineText value={text(next.title)} />.
                  </span>
                )}
              </li>
              {next && (
                <li
                  aria-hidden
                  className={cn(
                    "grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 py-1",
                    layout?.connector,
                  )}
                >
                  <span
                    className={cn(
                      "col-start-2 flex flex-col items-center text-[var(--hui-color-foreground-accent-primary)]",
                      layout?.arrow,
                    )}
                  >
                    <span className={cn("h-6 w-0 border-l-2 border-current", layout?.line)} />
                    <svg
                      viewBox="0 0 12 12"
                      className={cn("-mt-[9px] size-3 shrink-0", layout?.head)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4.5 6 9l4-4.5" />
                    </svg>
                  </span>
                  {!!label && (
                    <span className={cn("col-start-3 text-sm text-muted-foreground", layout?.label)}>
                      <InlineText value={label} />
                    </span>
                  )}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
      {!!caption && (
        <figcaption className="text-center text-sm text-muted-foreground">
          <InlineText value={caption} />
        </figcaption>
      )}
    </figure>
  );
}
