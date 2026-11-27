import { version as maplibreVersion } from "maplibre-gl/package.json";
import type { GeocodedPlace, MapServices } from "@/registry/honest-ai/generative";

/** Looks a place up through this site's server, which follows Nominatim's usage policy. */
async function geocode(query: string, signal: AbortSignal): Promise<GeocodedPlace | null> {
  const response = await fetch("/api/playground/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  const body = (await response.json().catch(() => null)) as
    | { place?: GeocodedPlace | null; error?: string }
    | null;
  if (!response.ok) throw new Error(body?.error ?? "The place lookup failed.");
  return body?.place ?? null;
}

const link =
  "rounded-[var(--hui-radius-1)] underline underline-offset-2 outline-none focus-visible:[outline:var(--hui-focus-ring)]";

/** Maps in the playground: OpenFreeMap tiles and OpenStreetMap place search. */
export const playgroundMapServices: MapServices = {
  geocode,
  // Copied from node_modules on install by scripts/copy-maplibre-worker.mjs.
  workerUrl: `/vendor/maplibre-gl/${maplibreVersion}/maplibre-gl-worker.mjs`,
  styles: {
    light: "https://tiles.openfreemap.org/styles/positron",
    dark: "https://tiles.openfreemap.org/styles/dark",
  },
  // US government aerial imagery: public domain, no key, US only. Elsewhere
  // its tiles are missing and the OpenFreeMap map shows through.
  imagery: {
    tiles: ["https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 16,
    attribution:
      '<a href="https://www.usgs.gov/programs/national-geospatial-program/national-map" target="_blank" rel="noreferrer">USGS The National Map</a>: Orthoimagery',
    label: "Satellite",
  },
  placeAttribution: (
    <>
      Places found with Nominatim. Place data ©{" "}
      <a className={link} href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
        OpenStreetMap contributors
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      .
    </>
  ),
};
