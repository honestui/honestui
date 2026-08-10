"use client";

import { IconComponentPreview } from "@/components/docs/component/icon-component-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "honestui/icons";
import { useMemo, useState, type ReactNode } from "react";

const PAGE_SIZE = 24;
const ALL_VARIANTS = "all";

const variantLabels: Record<string, string> = {
  default: "Default",
  doodle: "Doodle",
  filled: "Filled",
  rounded: "Rounded",
  shapes: "Shapes",
  sketch: "Sketch",
  pattern: "Pattern",
  texture: "Texture",
  character: "Character",
  symbols: "Symbol",
  wordmark: "Wordmark",
};

function formatVariant(variant: string) {
  return (
    variantLabels[variant] ??
    variant.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase())
  );
}

export interface IconCatalogItem {
  exportName: string;
  id: string;
  name: string;
  variant: string;
  tags: string[];
  preview: ReactNode;
}

export function IconCategoryBrowser({
  categoryName,
  icons,
  collection = "icons",
  importPath = "honestui/icons",
}: {
  categoryName: string;
  icons: IconCatalogItem[];
  collection?: "icons" | "logos" | "vectors";
  importPath?: string;
}) {
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState(ALL_VARIANTS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableVariants = useMemo(
    () => [...new Set(icons.map((icon) => icon.variant))].sort(),
    [icons],
  );

  const visibleIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return icons.filter((icon) => {
      const matchesVariant = variant === ALL_VARIANTS || icon.variant === variant;
      const matchesQuery =
        !normalized ||
        [icon.name, icon.exportName, icon.id, icon.variant, ...icon.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesVariant && matchesQuery;
    });
  }, [icons, query, variant]);

  const displayedIcons = visibleIcons.slice(0, visibleCount);
  const singular = collection === "logos" ? "logo" : collection === "vectors" ? "vector" : "icon";

  return (
    <>
      <div className="mt-12 mb-3">
        <h2 className="text-lg font-medium">
          All {categoryName.toLowerCase()} {collection}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Every {singular} includes its own preview and copyable React code.
        </p>
      </div>

      <div className="sticky top-14 z-20 -mx-1 mt-8 bg-background/92 px-1 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/78 sm:top-[35px]">
        <label className="sr-only" htmlFor="icon-search">
          Search {categoryName} {collection}
        </label>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
            />
            <Input
              id="icon-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={`Search ${icons.length.toLocaleString()} ${collection}…`}
              className="[&_[data-slot=input]]:pl-9"
            />
          </div>

          <Select
            value={variant}
            onValueChange={(value) => {
              const nextVariant = value ?? ALL_VARIANTS;
              setVariant(nextVariant);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by icon style">
              <SelectValue>
                {variant === ALL_VARIANTS
                  ? "All styles"
                  : formatVariant(variant)}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={ALL_VARIANTS}>All styles</SelectItem>
              {availableVariants.map((availableVariant) => (
                <SelectItem key={availableVariant} value={availableVariant}>
                  {formatVariant(availableVariant)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <p className="text-muted-foreground mt-2 text-[11px]" aria-live="polite">
          Showing {displayedIcons.length.toLocaleString()} of {visibleIcons.length.toLocaleString()}
          {query || variant !== ALL_VARIANTS ? " matching" : ""} {collection}
        </p>
      </div>

      {visibleIcons.length > 0 ? (
        <>
          <div className="grid gap-x-6 gap-y-10 xl:grid-cols-2">
            {displayedIcons.map((icon) => (
              <IconComponentPreview
                key={icon.exportName}
                exportName={icon.exportName}
                name={icon.name}
                preview={icon.preview}
                importPath={importPath}
              />
            ))}
          </div>

          {displayedIcons.length < visibleIcons.length ? (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setVisibleCount((count) => count + PAGE_SIZE);
                }}
              >
                Show {Math.min(PAGE_SIZE, visibleIcons.length - displayedIcons.length)} more
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
          <Search aria-hidden="true" className="text-muted-foreground mb-3 size-5" />
          <p className="text-sm font-medium">No matching {collection}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Try another search or style.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setVariant(ALL_VARIANTS);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}
