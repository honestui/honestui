"use client";
import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { InlineText } from "./inline-text";
import { array, nodeProps, text, type Props } from "./shared";

/**
 * A literal value (an address, a file, a host) in modest monospace. Lines may
 * break after a path or name separator, and hyphens break as usual, so
 * `mobile-host.mjs` wraps at a seam instead of mid-word. A token still too
 * long for its box breaks wherever it must rather than overflow.
 */
export function LiteralValue({ value, className }: { value: string; className?: string }) {
  const pieces = value.split(/(?<=[/._:@=?&])(?=[^/._:@=?&])/);
  return (
    <span className={cn("max-w-full font-mono text-[13px] leading-5 tabular-nums break-words", className)}>
      {pieces.map((piece, i) => (
        <React.Fragment key={i}>
          {i > 0 && <wbr />}
          {piece}
        </React.Fragment>
      ))}
    </span>
  );
}

/** Diagrams draw straight onto the reply: the host gives the background. */
export const diagramCanvas = "py-1";

/**
 * A box: a hairline mixed from the text color, a barely-there fill and no
 * shadow, so it reads on any surface in light and dark alike.
 */
export const diagramBox =
  "rounded-[10px] border border-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_12%,transparent)] bg-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_2.5%,transparent)] [[data-theme=dark]_&]:border-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_14%,transparent)]";

/** A figure caption under a diagram. */
export const diagramCaption =
  "mt-1 text-xs leading-[1.45] text-pretty text-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_55%,transparent)]";

/** Code inside a diagram's text reads as plain monospace, not as a chip. */
const flatCode = "[&_code]:mx-0 [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.93em]";

// Text tiers: the value is secondary, notes and arrow labels tertiary.
const secondary = "text-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_70%,transparent)]";
const tertiary = "text-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_55%,transparent)]";

/**
 * Container-query classes for the side-by-side layout. Each set turns on at a
 * width where that many boxes and their arrows still fit; below it, and for
 * longer chains, the boxes stack and each arrow points down from the middle
 * of the box with its label beside it. Side by side, the label sits just above
 * a line that runs level through the boxes' middle. Tailwind needs the class
 * names written out, so each set is spelled in full.
 */
const sideBySide = {
  md: {
    list: "@md:max-w-none @md:flex-row @md:items-stretch",
    node: "@md:min-w-[8.25rem] @md:flex-1 @md:basis-0",
    connector: "@md:h-auto @md:w-24 @md:shrink-0 @md:grid-cols-1 @md:grid-rows-[1fr_auto_1fr] @md:px-0",
    arrow: "@md:col-start-1 @md:row-start-2 @md:h-auto @md:w-full @md:flex-row @md:pr-1 @md:pb-0 @md:pl-1",
    line: "@md:h-0 @md:w-auto @md:flex-1 @md:border-l-0 @md:border-t",
    head: "@md:-ml-[6px] @md:mt-0 @md:-rotate-90",
    label: "@md:col-start-1 @md:row-start-1 @md:mb-1.5 @md:self-end @md:px-1 @md:pl-1 @md:text-center",
  },
  "2xl": {
    list: "@2xl:max-w-none @2xl:flex-row @2xl:items-stretch",
    node: "@2xl:min-w-[8.25rem] @2xl:flex-1 @2xl:basis-0",
    connector: "@2xl:h-auto @2xl:w-24 @2xl:shrink-0 @2xl:grid-cols-1 @2xl:grid-rows-[1fr_auto_1fr] @2xl:px-0",
    arrow: "@2xl:col-start-1 @2xl:row-start-2 @2xl:h-auto @2xl:w-full @2xl:flex-row @2xl:pr-1 @2xl:pb-0 @2xl:pl-1",
    line: "@2xl:h-0 @2xl:w-auto @2xl:flex-1 @2xl:border-l-0 @2xl:border-t",
    head: "@2xl:-ml-[6px] @2xl:mt-0 @2xl:-rotate-90",
    label: "@2xl:col-start-1 @2xl:row-start-1 @2xl:mb-1.5 @2xl:self-end @2xl:px-1 @2xl:pl-1 @2xl:text-center",
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
 * hidden from assistive technology. Side by side, the boxes stretch to one
 * height. Lines are borders and the open arrowhead uses currentColor, so both
 * stay visible in forced colors.
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
    <figure className={cn("@container m-0 grid gap-2", diagramCanvas)}>
      <ol className={cn("m-0 flex w-full max-w-sm list-none flex-col p-0", layout?.list)}>
        {nodes.map((node, i) => {
          const next = nodes[i + 1];
          const label = arrows[i] ?? "";
          const value = text(node.value);
          const detail = text(node.detail);
          return (
            <React.Fragment key={i}>
              <li className={cn("flex min-w-0", layout?.node)}>
                <div className={cn(diagramBox, "flex min-w-0 flex-1 flex-col px-3.5 py-3 text-left break-words")}>
                  <strong className={cn("max-w-full text-sm leading-5 font-medium text-pretty text-foreground", flatCode)}>
                    <InlineText value={text(node.title)} />
                  </strong>
                  {!!value && (
                    <LiteralValue value={value} className={cn("mt-0.5 text-[12.5px] leading-[18px]", secondary)} />
                  )}
                  {!!detail && (
                    <span className={cn("mt-1 text-xs leading-[1.4] text-pretty", tertiary, flatCode)}>
                      <InlineText value={detail} />
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
                    "grid grid-cols-[1fr_auto_1fr] items-center",
                    layout?.connector,
                  )}
                >
                  {/* The line is quieter than the boxes; its tip stops 4px short of the next box. */}
                  <span
                    className={cn(
                      "col-start-2 flex h-10 flex-col items-center pt-1 pb-1 text-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_25%,transparent)] [[data-theme=dark]_&]:text-[color-mix(in_oklab,var(--hui-color-foreground-base-primary)_30%,transparent)]",
                      layout?.arrow,
                    )}
                  >
                    <span className={cn("w-0 flex-1 border-l border-current", layout?.line)} />
                    <svg
                      viewBox="0 0 12 12"
                      className={cn("-mt-[6px] size-3 shrink-0", layout?.head)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 5 6 8 9 5" />
                    </svg>
                  </span>
                  {!!label && (
                    <span
                      className={cn(
                        "col-start-3 pl-2.5 text-xs leading-4 text-balance",
                        tertiary,
                        flatCode,
                        layout?.label,
                      )}
                    >
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
        <figcaption className={diagramCaption}>
          <InlineText value={caption} />
        </figcaption>
      )}
    </figure>
  );
}
