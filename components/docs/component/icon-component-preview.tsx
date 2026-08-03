"use client";

import { ComponentPreviewTabs } from "@/components/docs/component/component-preview-tabs";
import { DocsCopyButton } from "@/components/docs/layout/docs-copy-button";
import CopyButton from "@/components/docs/mdx/components/copy-button";
import { getIconUsageCode } from "@/lib/icon-code";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";

function HighlightedIconCode({
  exportName,
  importPath,
}: {
  exportName: string;
  importPath: string;
}) {
  return (
    <pre className="no-scrollbar h-full overflow-auto px-4 py-3.5 text-[.8125rem] leading-6 outline-none">
      <code className="whitespace-pre">
        <span className="block">
          <span className="text-[#D73A49] dark:text-[#F97583]">import</span>
          {" { "}
          <span className="text-[#005CC5] dark:text-[#79B8FF]">{exportName}</span>
          {" } "}
          <span className="text-[#D73A49] dark:text-[#F97583]">from</span>
          <span className="text-[#032F62] dark:text-[#9ECBFF]"> {`"${importPath}"`}</span>
          {";"}
        </span>
        <span aria-hidden="true" className="block">
          {" "}
        </span>
        <span className="block">
          <span className="text-[#D73A49] dark:text-[#F97583]">export function</span>
          <span className="text-[#6F42C1] dark:text-[#B392F0]"> {exportName}Example</span>
          {"() {"}
        </span>
        <span className="block">
          {"  "}
          <span className="text-[#D73A49] dark:text-[#F97583]">return</span>
          {" <"}
          <span className="text-[#005CC5] dark:text-[#79B8FF]">{exportName}</span>
          <span className="text-[#6F42C1] dark:text-[#B392F0]"> size</span>
          {"={"}
          <span className="text-[#005CC5] dark:text-[#79B8FF]">24</span>
          {"}"}
          <span className="text-[#6F42C1] dark:text-[#B392F0]"> aria-hidden</span>
          {"="}
          <span className="text-[#032F62] dark:text-[#9ECBFF]">{`"true"`}</span>
          {" />;"}
        </span>
        <span className="block">{"}"}</span>
      </code>
    </pre>
  );
}

function IsolatedIconPreview({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idPrefix = `icon-preview-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

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
  }, [idPrefix]);

  return (
    <div
      ref={containerRef}
      className="flex size-full items-center justify-center text-foreground [&_svg]:size-14"
    >
      {children}
    </div>
  );
}

export function IconComponentPreview({
  exportName,
  name,
  preview,
  importPath = "honestui/icons",
}: {
  exportName: string;
  name: string;
  preview: ReactNode;
  importPath?: string;
}) {
  const code = getIconUsageCode(exportName, importPath);

  return (
    <article>
      <h3 className="mb-2 text-sm font-medium">{name}</h3>

      <ComponentPreviewTabs
        className="mt-0 mb-0"
        previewClassName="h-44 sm:h-48"
        codeClassName="h-44 sm:h-48"
        title={exportName}
        titleAction={
          <DocsCopyButton value={exportName} label={`Copy ${exportName} import name`} />
        }
        component={<IsolatedIconPreview>{preview}</IsolatedIconPreview>}
        source={
          <div className="group/source relative h-full">
            <CopyButton
              withBlurBg
              code={code}
              className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover/source:opacity-100"
            />
            <HighlightedIconCode exportName={exportName} importPath={importPath} />
          </div>
        }
      />
    </article>
  );
}
