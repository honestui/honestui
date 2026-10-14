"use client";
import * as React from "react";
import { Button } from "../../../components/ui/button.js";
import { cn } from "../../../lib/utils.js";
import { useIsStreaming } from "../runtime/react";
import { InsideCardContext, array, nodeProps, text, type Props } from "./shared";

export type GeocodedPlace = { lat: number; lon: number; label: string };

/**
 * What a host app provides for generated maps. The model only names places;
 * `geocode` finds them, so coordinates always come from a lookup service the
 * app chose. Without these services, a Map shows its places as a list.
 */
export type MapServices = {
  /** Resolves to the best match, or null when there is none. Rejects on failure. */
  geocode: (query: string, signal: AbortSignal) => Promise<GeocodedPlace | null>;
  /** MapLibre's worker, served by the app (see scripts/copy-maplibre-worker.mjs). */
  workerUrl: string;
  /** MapLibre style URLs for each theme. */
  styles: { light: string; dark: string };
  /** Credit for the place data, shown under the list. */
  placeAttribution: React.ReactNode;
  /**
   * Aerial or satellite tiles. When present, maps open on this view and the
   * reader can switch to the drawn map. Where it has no tile, the map shows.
   */
  imagery?: {
    /** Raster tile URLs with {z}, {x} and {y}. */
    tiles: string[];
    /** The highest zoom with tiles; MapLibre enlarges past it. */
    maxzoom: number;
    /** Credit shown in the map's attribution, as HTML. */
    attribution: string;
    /** The toggle's name for this view, such as "Satellite". */
    label: string;
  };
};

export const MapServicesContext = React.createContext<MapServices | null>(null);

const MapCanvas = React.lazy(() => import("./map-canvas"));

// Coarse enough that one tile covers a place's surroundings.
const COVERAGE_ZOOM = 12;

/** The imagery tile that contains a place, at the coverage zoom. */
function tileUrl(template: string, lat: number, lon: number) {
  const n = 2 ** COVERAGE_ZOOM;
  const x = Math.floor(((lon + 180) / 360) * n);
  const radians = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * n);
  return template
    .replace("{z}", String(COVERAGE_ZOOM))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

/**
 * Whether the imagery has a tile at every place, found by asking for one tile
 * each. Imagery such as US aerial photography stops at a border that no simple
 * box describes, so this asks rather than guesses. Undefined while checking.
 */
function useImageryCoverage(imagery: MapServices["imagery"], places: GeocodedPlace[]) {
  const key = JSON.stringify(places.map(({ lat, lon }) => [lat, lon]));
  const [coverage, setCoverage] = React.useState<{ key: string; covers: boolean }>();
  React.useEffect(() => {
    if (!imagery || key === "[]") return;
    const controller = new AbortController();
    const points = JSON.parse(key) as [number, number][];
    Promise.all(
      points.map(([lat, lon]) =>
        fetch(tileUrl(imagery.tiles[0], lat, lon), { signal: controller.signal }).then(
          (response) => response.ok,
          () => false,
        ),
      ),
    ).then((found) => {
      if (!controller.signal.aborted) setCoverage({ key, covers: found.every(Boolean) });
    });
    return () => controller.abort();
  }, [imagery, key]);
  if (!imagery) return false;
  return coverage?.key === key ? coverage.covers : undefined;
}

type PlaceInput = { name: string; query: string; note: string };
type Lookup =
  | { status: "pending" }
  | { status: "found"; place: GeocodedPlace }
  | { status: "missing" }
  | { status: "failed"; message: string };

function readPlaces(value: unknown): PlaceInput[] {
  return array(value)
    .map(nodeProps)
    .filter((place) => text(place.name))
    .map((place) => ({
      name: text(place.name),
      query: text(place.query) || text(place.name),
      note: text(place.note),
    }));
}

/** Looks every place up once the reply is complete, and again on retry. */
function useLookups(places: PlaceInput[], services: MapServices | null, ready: boolean) {
  const queries = places.map((place) => place.query);
  const key = JSON.stringify(queries);
  const [attempt, setAttempt] = React.useState(0);
  const [lookups, setLookups] = React.useState<{ key: string; results: Lookup[] }>({
    key: "",
    results: [],
  });

  React.useEffect(() => {
    if (!services || !ready) return;
    const controller = new AbortController();
    const list = JSON.parse(key) as string[];
    // Every lookup resolves on its own, so places appear as they are found.
    list.forEach((query, index) => {
      services
        .geocode(query, controller.signal)
        .then(
          (place): Lookup => (place ? { status: "found", place } : { status: "missing" }),
          (error: unknown): Lookup => ({
            status: "failed",
            message: error instanceof Error ? error.message : "The place lookup failed.",
          }),
        )
        .then((result) => {
          if (controller.signal.aborted) return;
          setLookups((previous) => {
            const results =
              previous.key === `${key}#${attempt}`
                ? [...previous.results]
                : list.map((): Lookup => ({ status: "pending" }));
            results[index] = result;
            return { key: `${key}#${attempt}`, results };
          });
        });
    });
    return () => controller.abort();
  }, [key, services, ready, attempt]);

  const current = lookups.key === `${key}#${attempt}` ? lookups.results : [];
  const results = queries.map((_, index): Lookup => current[index] ?? { status: "pending" });
  return { results, retry: () => setAttempt((value) => value + 1) };
}

export function GeneratedMap({ props }: { props: Props }) {
  const services = React.useContext(MapServicesContext);
  // In a Card, the Card is the frame: the map becomes a rounded image and the
  // list lines up with the Card's content.
  const inCard = React.useContext(InsideCardContext);
  const streaming = useIsStreaming();
  const places = readPlaces(props.places);
  const numbered = props.kind === "route";
  const caption = text(props.caption);
  const { results, retry } = useLookups(places, services, !streaming);
  const [canvasFailed, setCanvasFailed] = React.useState(false);

  const found = results.flatMap((result, index) =>
    result.status === "found" ? [{ ...result.place, index }] : [],
  );
  const imageryCovers = useImageryCoverage(services?.imagery, found);

  if (places.length === 0) return null;

  const failure = results.find(
    (result): result is Extract<Lookup, { status: "failed" }> => result.status === "failed",
  );
  const pending = results.some((result) => result.status === "pending");
  const notice = !services
    ? "Maps aren't set up in this app, so the places are listed instead."
    : streaming
      ? "The map appears when the reply is complete."
      : canvasFailed
        ? "The map couldn't load in this browser. The places are listed below."
        : !pending && found.length === 0 && !failure
          ? "None of these places could be found, so there is nothing to map."
          : undefined;

  const List = numbered ? "ol" : "ul";
  return (
    <figure className="m-0 grid gap-3">
      <div
        data-frame={inCard ? undefined : ""}
        className={cn(
          inCard
            ? "grid gap-3"
            : "overflow-hidden rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)]",
        )}
      >
        <div
          className={cn(
            "empty:hidden",
            inCard
              ? "overflow-hidden rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)]"
              : "border-b border-[var(--hui-color-border-base-primary)]",
          )}
        >
        {services && !streaming && !canvasFailed && found.length > 0 && imageryCovers === undefined && (
          <MapPlaceholder text="Loading the map…" />
        )}
        {services && !streaming && !canvasFailed && found.length > 0 && imageryCovers !== undefined && (
          <React.Suspense fallback={<MapPlaceholder text="Loading the map…" />}>
            <MapCanvas
              services={services}
              imageryCovers={imageryCovers}
              points={found.map(({ lat, lon, index }) => ({
                lat,
                lon,
                mark: numbered ? String(index + 1) : undefined,
              }))}
              label={`Map of ${found.length} ${found.length === 1 ? "place" : "places"}. The same places are listed below.`}
              onFail={() => setCanvasFailed(true)}
            />
          </React.Suspense>
        )}
        {services && !streaming && !canvasFailed && found.length === 0 && pending && (
          <MapPlaceholder text="Finding places…" />
        )}
        </div>
        {notice && (
          <p
            className={cn(
              "m-0 bg-[var(--hui-color-background-base-secondary)] text-sm text-muted-foreground",
              inCard
                ? "rounded-[var(--hui-radius-2)] px-3 py-2"
                : "border-b border-[var(--hui-color-border-base-primary)] px-5 py-3",
            )}
          >
            {notice}
          </p>
        )}
        {failure && (
          <div
            role="alert"
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 text-sm",
              !inCard && "border-b border-[var(--hui-color-border-base-primary)] px-5 py-3",
            )}
          >
            <span>{`Some places couldn't be looked up. ${failure.message}`}</span>
            <Button variant="secondary" size="sm" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
        <List className={cn("m-0 grid list-none gap-3", inCard ? "p-0" : "p-5")}>
          {places.map((place, index) => {
            const result = results[index];
            return (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={
                    numbered
                      ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--hui-color-background-accent-emphasis)] text-xs font-semibold text-[var(--hui-color-foreground-accent-emphasis)]"
                      : "mt-1.5 size-3 shrink-0 rounded-full bg-[var(--hui-color-background-accent-emphasis)]"
                  }
                >
                  {numbered ? index + 1 : ""}
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="font-medium">{place.name}</span>
                  {!!place.note && <span className="text-sm">{place.note}</span>}
                  <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    {!services || streaming
                      ? null
                      : result.status === "found"
                        ? `Matched: ${result.place.label}`
                        : result.status === "missing"
                          ? "Not found, so it isn't on the map."
                          : result.status === "failed"
                            ? "Couldn't be looked up."
                            : "Finding…"}
                  </span>
                </span>
              </li>
            );
          })}
        </List>
        {services && (
          <p
            className={cn(
              "m-0 border-t border-[var(--hui-color-border-base-primary)] text-xs text-muted-foreground",
              inCard ? "pt-2" : "px-5 py-2",
            )}
          >
            {services.placeAttribution}
          </p>
        )}
      </div>
      {!!caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function MapPlaceholder({ text: message }: { text: string }) {
  return (
    <div className="flex aspect-[4/3] max-h-96 w-full items-center justify-center bg-[var(--hui-color-background-base-secondary)] text-sm text-muted-foreground sm:aspect-[16/9]">
      {message}
    </div>
  );
}
