"use client";

import { cn } from "@/lib/utils";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Many assets reuse short SVG ids such as "a" for gradients and clip paths.
 * Rendering several on one page makes those ids collide, so each instance gets
 * its ids and id references rewritten with a unique prefix.
 */
export function IsolatedSvg({
  children,
  className,
  contentKey,
}: {
  children: ReactNode;
  className?: string;
  /** Changes when a different SVG is rendered, so its ids are rewritten too. */
  contentKey: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const idPrefix = `asset-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    for (const svg of container.querySelectorAll("svg")) {
      const idReplacements = new Map<string, string>();

      for (const element of svg.querySelectorAll<SVGElement>("[id]")) {
        if (element.id.startsWith(`${idPrefix}-`)) continue;

        const originalId = element.id;
        const uniqueId = `${idPrefix}-${originalId}`;
        idReplacements.set(originalId, uniqueId);
        element.id = uniqueId;
      }

      if (idReplacements.size === 0) continue;

      for (const element of [svg, ...svg.querySelectorAll("*")]) {
        for (const attribute of Array.from(element.attributes)) {
          let value = attribute.value;

          for (const [originalId, uniqueId] of idReplacements) {
            value = value
              .replaceAll(`url(#${originalId})`, `url(#${uniqueId})`)
              .replaceAll(`url("#${originalId}")`, `url("#${uniqueId}")`)
              .replaceAll(`url('#${originalId}')`, `url('#${uniqueId}')`);

            if (value === `#${originalId}`) value = `#${uniqueId}`;
          }

          if (value !== attribute.value) element.setAttribute(attribute.name, value);
        }
      }
    }
  }, [idPrefix, contentKey]);

  return (
    <span ref={containerRef} className={cn("flex items-center justify-center", className)}>
      {children}
    </span>
  );
}
