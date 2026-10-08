"use client";

import { IsolatedSvg } from "@/components/docs/icons/isolated-svg";
import { Button } from "@/components/ui/button";
import type { AssetCollection } from "@/globals/constants/icon-categories";
import {
  formatVariant,
  getAssetCategoryHref,
  getAssetImportCode,
  getAssetJsxCode,
  type AssetMatch,
} from "@/lib/asset-catalog";
import type { AssetComponent } from "@/lib/asset-modules";
import { cn } from "@/lib/utils";
import { useClipboard } from "@mantine/hooks";
import Link from "next/link";

const interactiveFocus = "outline-none focus-visible:[outline:var(--hui-focus-ring)]";

export function AssetGlyph({
  Component,
  collection,
  exportName,
  size,
  className,
}: {
  Component: AssetComponent | undefined;
  collection: AssetCollection;
  exportName: string;
  size: number;
  className?: string;
}) {
  if (!Component) {
    return (
      <span
        aria-hidden="true"
        className={cn("bg-muted rounded motion-safe:animate-pulse", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <IsolatedSvg contentKey={exportName} className={className}>
      {collection === "icons" ? (
        <Component aria-hidden="true" size={size} strokeWidth={1.5} />
      ) : (
        <Component aria-hidden="true" size={size} />
      )}
    </IsolatedSvg>
  );
}

function CopyRow({ label, copyLabel, value }: { label: string; copyLabel: string; value: string }) {
  const { copy, copied, error } = useClipboard({ timeout: 1500 });
  const status = error ? "Copy failed" : copied ? "Copied" : "";

  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <code className="bg-muted/60 no-scrollbar min-w-0 flex-1 overflow-x-auto rounded px-2 py-1.5 font-mono text-xs whitespace-nowrap">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-16 shrink-0"
          aria-label={copyLabel}
          onClick={() => copy(value)}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <span role="status" className="sr-only">
          {status}
        </span>
      </dd>
      {error ? (
        <p className="text-muted-foreground mt-1 text-xs">
          Copying is blocked in this browser. Select the text and copy it manually.
        </p>
      ) : null}
    </div>
  );
}

export function AssetDetail({
  collection,
  match,
  styles,
  getComponent,
  onSelect,
  showCategoryLink,
}: {
  collection: AssetCollection;
  match: AssetMatch;
  /** Every asset drawn from the same base artwork, including this one. */
  styles: AssetMatch[];
  getComponent: (sourceKey: string, exportName: string) => AssetComponent | undefined;
  onSelect: (exportName: string) => void;
  showCategoryLink: boolean;
}) {
  const { asset, group } = match;
  const importPath = `honestui/${collection}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-muted/40 text-foreground flex h-40 items-center justify-center rounded-lg border">
        <AssetGlyph
          Component={getComponent(group.sourceKey, asset.exportName)}
          collection={collection}
          exportName={asset.exportName}
          size={collection === "icons" ? 64 : 112}
        />
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">
        {formatVariant(asset.variant)} style in{" "}
        {showCategoryLink ? (
          <Link
            href={getAssetCategoryHref(collection, group.slug)}
            className={cn("text-foreground underline underline-offset-2", interactiveFocus)}
          >
            {group.name}
          </Link>
        ) : (
          group.name
        )}
      </p>

      <dl className="flex flex-col gap-3">
        <CopyRow label="Name" copyLabel="Copy name" value={asset.exportName} />
        <CopyRow
          label="Import"
          copyLabel="Copy import"
          value={getAssetImportCode(asset.exportName, importPath)}
        />
        <CopyRow label="JSX" copyLabel="Copy JSX" value={getAssetJsxCode(asset.exportName)} />
      </dl>

      {styles.length > 1 ? (
        <div>
          <h3 className="text-muted-foreground font-sans! text-xs! leading-4! font-normal!">Styles</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {styles.map((style) => {
              const isCurrent = style.asset.exportName === asset.exportName;

              return (
                <li key={style.asset.exportName}>
                  <button
                    type="button"
                    aria-pressed={isCurrent}
                    onClick={() => onSelect(style.asset.exportName)}
                    className={cn(
                      "hover:bg-muted/60 aria-pressed:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-left text-xs aria-pressed:border-[var(--hui-color-border-base-primary)]",
                      interactiveFocus,
                    )}
                  >
                    <AssetGlyph
                      Component={getComponent(style.group.sourceKey, style.asset.exportName)}
                      collection={collection}
                      exportName={style.asset.exportName}
                      size={20}
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate font-mono">
                      {style.asset.exportName}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatVariant(style.asset.variant)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
