"use client";

import { AssetDetail, AssetGlyph } from "@/components/docs/icons/asset-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { ASSET_COUNTS, type AssetCollection } from "@/globals/constants/icon-categories";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import {
  ALL_VARIANTS,
  ASSET_COLLECTION_LABELS,
  filterGroupsByVariant,
  formatVariant,
  getAssetCategoryHref,
  getAssetCollectionHref,
  listVariants,
  searchAssets,
  type AssetGroup,
  type AssetMatch,
} from "@/lib/asset-catalog";
import {
  retryFailedAssetModules,
  useAssetModules,
  type AssetComponent,
} from "@/lib/asset-modules";
import { cn } from "@/lib/utils";
import { Search } from "honestui/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Tiles mount in batches as the reader scrolls, so a 4,000-icon collection
// never renders (or downloads) more than what has been scrolled past.
const BATCH_SIZE = 240;
const FLOATING_PANEL_MIN_WIDTH = 1024;
// Matches the floating card's `w-80` and `right-5`, plus a gap beside it.
const FLOATING_PANEL_FOOTPRINT_PX = 320 + 20 + 24;
const URL_SYNC_DELAY_MS = 250;
const COLLECTIONS: AssetCollection[] = ["icons", "logos", "vectors"];

const interactiveFocus = "outline-none focus-visible:[outline:var(--hui-focus-ring)]";

const tileLayout: Record<AssetCollection, { glyphSize: number; grid: string; tile: string }> = {
  icons: {
    glyphSize: 24,
    grid: "grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]",
    tile: "h-[5.5rem]",
  },
  logos: {
    glyphSize: 32,
    grid: "grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]",
    tile: "h-[6.5rem]",
  },
  vectors: {
    glyphSize: 48,
    grid: "grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))]",
    tile: "h-[7.5rem]",
  },
};

interface ResultSection {
  key: string;
  heading?: { name: string; href: string; count: number };
  matches: AssetMatch[];
}

function takeMatches(sections: ResultSection[], limit: number) {
  const visible: ResultSection[] = [];
  let remaining = limit;

  for (const section of sections) {
    if (remaining <= 0) break;
    const matches = section.matches.slice(0, remaining);
    visible.push({ ...section, matches });
    remaining -= matches.length;
  }

  return visible;
}

function uniqueSourceKeys(matches: AssetMatch[]) {
  return [...new Set(matches.map((match) => match.group.sourceKey))].sort();
}

const AssetTile = memo(function AssetTile({
  match,
  collection,
  Component,
  isSelected,
  onToggle,
}: {
  match: AssetMatch;
  collection: AssetCollection;
  Component: AssetComponent | undefined;
  isSelected: boolean;
  onToggle: (exportName: string) => void;
}) {
  const { asset } = match;
  const layout = tileLayout[collection];
  const accessibleName =
    asset.variant === "default" ? asset.name : `${asset.name}, ${formatVariant(asset.variant)}`;

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={accessibleName}
        title={asset.exportName}
        onClick={() => onToggle(asset.exportName)}
        className={cn(
          "text-foreground hover:bg-muted/60 aria-pressed:bg-muted flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-transparent px-1.5 aria-pressed:border-[var(--hui-color-border-base-primary)] forced-colors:aria-pressed:[border-color:Highlight]",
          layout.tile,
          interactiveFocus,
        )}
      >
        <AssetGlyph
          Component={Component}
          collection={collection}
          exportName={asset.exportName}
          size={layout.glyphSize}
        />
        <span className="text-muted-foreground line-clamp-2 w-full text-center text-[11px] leading-[1.2] break-words">
          {asset.name}
        </span>
      </button>
    </li>
  );
});

function AssetResults({
  collection,
  sections,
  total,
  selectedName,
  onToggle,
}: {
  collection: AssetCollection;
  sections: ResultSection[];
  total: number;
  selectedName: string | null;
  onToggle: (exportName: string) => void;
}) {
  const [limit, setLimit] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = limit < total;

  const visibleSections = useMemo(() => takeMatches(sections, limit), [sections, limit]);
  const sourceKeys = useMemo(
    () => uniqueSourceKeys(visibleSections.flatMap((section) => section.matches)),
    [visibleSections],
  );
  const { getComponent, failedSourceKeys } = useAssetModules(collection, sourceKeys);

  // Re-observing after each batch lets a short page keep filling until the
  // sentinel leaves the viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setLimit((current) => current + BATCH_SIZE);
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, limit]);

  return (
    <div className="relative">
      {failedSourceKeys.length > 0 ? (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
        >
          <p>
            Some previews did not load. Names still work for search and copying. Check your
            connection, then try again.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => retryFailedAssetModules(collection, failedSourceKeys)}
          >
            Retry previews
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-8">
        {visibleSections.map((section) => (
          <section key={section.key} aria-label={section.heading?.name}>
            {section.heading ? (
              <h2 className="mb-2 flex items-baseline gap-2 text-base! leading-6!">
                <Link
                  href={section.heading.href}
                  className={cn("rounded-sm hover:underline", interactiveFocus)}
                >
                  {section.heading.name}
                </Link>
                <span className="text-muted-foreground text-xs font-normal">
                  {section.heading.count.toLocaleString()}
                </span>
              </h2>
            ) : null}
            <ul className={cn("grid gap-1", tileLayout[collection].grid)}>
              {section.matches.map((match) => (
                <AssetTile
                  key={match.asset.exportName}
                  match={match}
                  collection={collection}
                  Component={getComponent(match.group.sourceKey, match.asset.exportName)}
                  isSelected={match.asset.exportName === selectedName}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {hasMore ? (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[150vh]"
        />
      ) : null}
    </div>
  );
}

export function AssetBrowser({
  collection,
  groups,
  categorySlug,
}: {
  collection: AssetCollection;
  groups: AssetGroup[];
  /** Set on a category page, where `groups` holds only that category. */
  categorySlug?: string;
}) {
  const searchParams = useSearchParams();
  const labels = ASSET_COLLECTION_LABELS[collection];
  const isCategoryPage = categorySlug !== undefined;
  const scopeName = isCategoryPage ? `${groups[0]?.name ?? ""} ${labels.plural}` : labels.plural;

  const variants = useMemo(() => listVariants(groups), [groups]);
  const assetIndex = useMemo(() => {
    const byExportName = new Map<string, AssetMatch>();
    const byBaseId = new Map<string, AssetMatch[]>();

    for (const group of groups) {
      for (const asset of group.assets) {
        const match = { asset, group };
        byExportName.set(asset.exportName, match);
        byBaseId.set(asset.baseId, [...(byBaseId.get(asset.baseId) ?? []), match]);
      }
    }

    return { byExportName, byBaseId };
  }, [groups]);
  const totalAssets = assetIndex.byExportName.size;

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [variant, setVariant] = useState(() => {
    const requested = searchParams.get("style");
    return requested && variants.includes(requested) ? requested : ALL_VARIANTS;
  });
  const [selectedName, setSelectedName] = useState(() => {
    const requested = searchParams.get("icon");
    return requested && assetIndex.byExportName.has(requested) ? requested : null;
  });

  // Keep the search shareable and restorable. Debounced because browsers
  // rate-limit history updates.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const entries = {
        q: query.trim(),
        style: variant === ALL_VARIANTS ? "" : variant,
        icon: selectedName ?? "",
      };

      for (const [key, value] of Object.entries(entries)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      const search = params.toString();
      const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
      if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(null, "", nextUrl);
      }
    }, URL_SYNC_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [query, variant, selectedName]);

  const activeQuery = useDeferredValue(query.trim());
  const isFiltered = activeQuery !== "" || variant !== ALL_VARIANTS;

  const sections = useMemo<ResultSection[]>(() => {
    if (activeQuery) {
      const matches = searchAssets(groups, activeQuery, variant);
      return matches.length > 0 ? [{ key: "search", matches }] : [];
    }

    return filterGroupsByVariant(groups, variant).map((group) => ({
      key: group.slug,
      heading: isCategoryPage
        ? undefined
        : {
            name: group.name,
            href: getAssetCategoryHref(collection, group.slug),
            count: group.assets.length,
          },
      matches: group.assets.map((asset) => ({ asset, group })),
    }));
  }, [activeQuery, collection, groups, isCategoryPage, variant]);
  const resultCount = sections.reduce((count, section) => count + section.matches.length, 0);

  const selected = selectedName ? (assetIndex.byExportName.get(selectedName) ?? null) : null;
  const selectedStyles = useMemo(
    () => (selected ? (assetIndex.byBaseId.get(selected.asset.baseId) ?? [selected]) : []),
    [assetIndex, selected],
  );
  const styleSourceKeys = useMemo(() => uniqueSourceKeys(selectedStyles), [selectedStyles]);
  const { getComponent } = useAssetModules(collection, styleSourceKeys);

  const isCompact = useBreakpoint(FLOATING_PANEL_MIN_WIDTH);
  const isPanelFloating = !isCompact && selected !== null;

  // The card is fixed to the viewport while the content is centered, so the
  // room the grid must give up depends on the window width.
  const contentRef = useRef<HTMLDivElement>(null);
  const [panelInset, setPanelInset] = useState(0);
  useLayoutEffect(() => {
    if (!isPanelFloating) return;

    function measure() {
      const content = contentRef.current;
      if (!content) return;
      const clearRight = window.innerWidth - FLOATING_PANEL_FOOTPRINT_PX;
      setPanelInset(Math.max(0, Math.ceil(content.getBoundingClientRect().right - clearRight)));
    }

    // The content also moves when the docs sidebar collapses, without a window resize.
    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isPanelFloating]);
  const toggleSelected = useCallback((exportName: string) => {
    setSelectedName((current) => (current === exportName ? null : exportName));
  }, []);

  function clearFilters() {
    setQuery("");
    setVariant(ALL_VARIANTS);
  }

  const resultNoun = resultCount === 1 ? labels.singular : labels.plural;
  const styleSuffix = variant === ALL_VARIANTS ? "" : ` in ${formatVariant(variant)} style`;
  const status = activeQuery
    ? `${resultCount.toLocaleString()} ${resultNoun} ${resultCount === 1 ? "matches" : "match"} “${activeQuery}”${styleSuffix}`
    : isCategoryPage || isFiltered
      ? `${resultCount.toLocaleString()} ${resultNoun}${styleSuffix}`
      : `${resultCount.toLocaleString()} ${resultNoun} in ${groups.length} categories`;

  const detail = selected ? (
    <AssetDetail
      collection={collection}
      match={selected}
      styles={selectedStyles}
      getComponent={getComponent}
      onSelect={setSelectedName}
      showCategoryLink={!isCategoryPage}
    />
  ) : null;

  return (
    <div className={isCategoryPage ? "mt-10" : "mt-8"}>
      {isCategoryPage ? null : (
        <nav aria-label="Collections" className="relative z-30 flex gap-1 border-b">
          {COLLECTIONS.map((id) => (
            <Link
              key={id}
              href={`${getAssetCollectionHref(id)}${activeQuery ? `?q=${encodeURIComponent(activeQuery)}` : ""}`}
              aria-current={id === collection ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground -mb-px flex items-baseline gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-[current=page]:border-current",
                interactiveFocus,
              )}
            >
              {ASSET_COLLECTION_LABELS[id].title}
              <span className="text-xs font-normal">
                {ASSET_COUNTS[id].toLocaleString()}
              </span>
            </Link>
          ))}
        </nav>
      )}

      <div ref={contentRef}>
        <div
          className="min-w-0"
          style={isPanelFloating ? { paddingRight: panelInset } : undefined}
        >
          {/* From sm up the docs header is a transparent 35px strip, so the toolbar sticks under it and paints that strip itself. */}
          <div className="bg-background sticky top-14 z-20 -mx-1 px-1 py-3 sm:top-[35px] sm:before:absolute sm:before:inset-x-0 sm:before:bottom-full sm:before:h-[35px] sm:before:bg-background">
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <label className="sr-only" htmlFor="asset-search">
                  Search {scopeName} by name
                </label>
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
                />
                <Input
                  id="asset-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${totalAssets.toLocaleString()} ${scopeName} by name`}
                  className="[&_[data-slot=input]]:pl-9"
                />
              </div>

              {variants.length > 1 ? (
                <Select value={variant} onValueChange={(value) => setVariant(value ?? ALL_VARIANTS)}>
                  <SelectTrigger className="w-full sm:w-40" aria-label="Filter by style">
                    <SelectValue>
                      {variant === ALL_VARIANTS ? "All styles" : formatVariant(variant)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value={ALL_VARIANTS}>All styles</SelectItem>
                    {variants.map((availableVariant) => (
                      <SelectItem key={availableVariant} value={availableVariant}>
                        {formatVariant(availableVariant)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-2 text-xs" role="status">
              {status}
            </p>
          </div>

          {resultCount > 0 ? (
            <AssetResults
              key={`${activeQuery}\n${variant}`}
              collection={collection}
              sections={sections}
              total={resultCount}
              selectedName={selectedName}
              onToggle={toggleSelected}
            />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
              <p className="text-sm font-medium">No {scopeName} match this search</p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                Search looks at names, categories, and styles. Try a shorter word or a synonym.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  Clear search
                </Button>
                {isCategoryPage && activeQuery ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={`${getAssetCollectionHref(collection)}?q=${encodeURIComponent(activeQuery)}`}
                      />
                    }
                  >
                    Search all {labels.plural}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Wide screens get a floating card that leaves the grid usable behind it;
          narrow screens get a modal bottom sheet. */}
      <Sheet
        open={selected !== null}
        modal={isCompact}
        disablePointerDismissal={!isCompact}
        onOpenChange={(open) => {
          if (!open) setSelectedName(null);
        }}
      >
        <SheetPopup
          side={isCompact ? "bottom" : "right"}
          showBackdrop={isCompact}
          className={cn(
            "no-scrollbar gap-0 overflow-y-auto",
            isCompact
              ? "max-h-[85dvh]"
              : "top-12 right-5 bottom-auto h-auto max-h-[calc(100dvh-4.25rem)] w-80 rounded-xl border shadow-xl",
          )}
        >
          <SheetHeader className="pr-10">
            <SheetTitle className="text-base! leading-6!">{selected?.asset.name}</SheetTitle>
            <SheetDescription className="sr-only">
              Preview, styles, and copyable code for this {labels.singular}.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">{detail}</div>
        </SheetPopup>
      </Sheet>
    </div>
  );
}
