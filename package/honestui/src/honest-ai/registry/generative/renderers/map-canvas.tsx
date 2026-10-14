"use client";
// Loaded only when a reply contains a map, so MapLibre's code and styles stay
// off every other page.
import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { cn } from "../../../lib/utils.js";
import type { MapServices } from "./map";

type Point = { lat: number; lon: number; mark?: string };
type View = "satellite" | "map";
type Visibility = "visible" | "none";

// Close enough to show a town; a single place is never shown at street level.
const SINGLE_PLACE_ZOOM = 11;
// Near places, such as buildings on one campus, can be told apart at this zoom.
const MAX_FIT_ZOOM = 16;
const IMAGERY = "imagery";

/**
 * Adds the imagery just above the style's background. Changing the style drops
 * added layers, so this runs on every style load.
 */
function addImagery(instance: maplibregl.Map, imagery: NonNullable<MapServices["imagery"]>) {
  if (!instance.getSource(IMAGERY)) {
    instance.addSource(IMAGERY, {
      type: "raster",
      tiles: imagery.tiles,
      tileSize: 256,
      maxzoom: imagery.maxzoom,
      attribution: imagery.attribution,
    });
  }
  if (!instance.getLayer(IMAGERY)) {
    const aboveBackground = instance.getStyle().layers.find((layer) => layer.type !== "background")?.id;
    instance.addLayer({ id: IMAGERY, type: "raster", source: IMAGERY }, aboveBackground);
  }
}

/**
 * Satellite shows the imagery and the style's labels only: drawn buildings,
 * roads and land would hide the photo. Map restores each layer as the style
 * set it. Where the imagery has no tile, the background shows through.
 */
function applyView(instance: maplibregl.Map, satellite: boolean, original: Map<string, Visibility>) {
  for (const layer of instance.getStyle().layers) {
    if (layer.id === IMAGERY) {
      instance.setLayoutProperty(IMAGERY, "visibility", satellite ? "visible" : "none");
      continue;
    }
    if (layer.type === "symbol" || layer.type === "background") continue;
    if (!original.has(layer.id))
      original.set(layer.id, instance.getLayoutProperty(layer.id, "visibility") === "none" ? "none" : "visible");
    instance.setLayoutProperty(layer.id, "visibility", satellite ? "none" : original.get(layer.id));
  }
}

function markerElement(mark: string | undefined) {
  const element = document.createElement("div");
  // The list under the map names every place, so markers are not read twice.
  element.setAttribute("aria-hidden", "true");
  element.className = mark
    ? "flex size-7 items-center justify-center rounded-full border-2 border-white bg-[var(--hui-color-background-accent-emphasis)] text-xs font-semibold text-[var(--hui-color-foreground-accent-emphasis)] shadow-[var(--hui-shadow-soft)]"
    : "size-4 rounded-full border-2 border-white bg-[var(--hui-color-background-accent-emphasis)] shadow-[var(--hui-shadow-soft)]";
  element.textContent = mark ?? "";
  return element;
}

export default function MapCanvas({
  services,
  points,
  label,
  imageryCovers,
  onFail,
}: {
  services: MapServices;
  /** Whether the imagery has tiles at every place; without them, satellite would be blank. */
  imageryCovers: boolean;
  points: Point[];
  label: string;
  onFail: () => void;
}) {
  const container = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<maplibregl.Map | null>(null);
  const { resolvedTheme } = useTheme();
  const imagery = imageryCovers ? services.imagery : undefined;
  // Satellite first when the app provides imagery; the reader can switch.
  const [view, setView] = React.useState<View>(imagery ? "satellite" : "map");
  const satellite = view === "satellite" && !!imagery;
  // Over imagery, the dark style's light labels with dark halos read best.
  const style = satellite || resolvedTheme === "dark" ? services.styles.dark : services.styles.light;
  const satelliteRef = React.useRef(satellite);
  const originalVisibility = React.useRef(new Map<string, Visibility>());
  React.useEffect(() => {
    satelliteRef.current = satellite;
  });
  const failRef = React.useRef(onFail);
  React.useEffect(() => {
    failRef.current = onFail;
  });

  // One map for the component's life; markers and style follow below.
  React.useEffect(() => {
    if (!container.current) return;
    maplibregl.setWorkerUrl(services.workerUrl);
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style,
        center: [0, 20],
        zoom: 1,
        attributionControl: { compact: true },
        // Scrolling the conversation should scroll it, not zoom the map.
        cooperativeGestures: true,
        fadeDuration: 0,
      });
    } catch {
      // WebGL is unavailable or failed to start.
      failRef.current();
      return;
    }
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    if (imagery)
      instance.on("style.load", () => {
        // A new style has its own layers, so their original visibility is read afresh.
        originalVisibility.current.clear();
        addImagery(instance, imagery);
        applyView(instance, satelliteRef.current, originalVisibility.current);
      });
    instance.on("error", (event: maplibregl.ErrorEvent) => {
      // A failed style or WebGL context leaves nothing to look at; a single
      // missing tile does not, so only those failures replace the map.
      const message = String(event.error?.message ?? "");
      if (!instance.isStyleLoaded() && /style|webgl|context/i.test(message)) failRef.current();
    });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
    // The style is applied by the effect below; recreating the map would lose the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.workerUrl]);

  React.useEffect(() => {
    map.current?.setStyle(style);
  }, [style]);

  React.useEffect(() => {
    const instance = map.current;
    if (instance?.getLayer(IMAGERY)) applyView(instance, satellite, originalVisibility.current);
  }, [satellite]);

  const key = JSON.stringify(points);
  React.useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const list = JSON.parse(key) as Point[];
    const markers = list.map((point) =>
      new maplibregl.Marker({ element: markerElement(point.mark) })
        .setLngLat([point.lon, point.lat])
        .addTo(instance),
    );
    // No fly-in: the view jumps straight to the places.
    if (list.length === 1) {
      instance.jumpTo({ center: [list[0].lon, list[0].lat], zoom: SINGLE_PLACE_ZOOM });
    } else if (list.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      list.forEach((point) => bounds.extend([point.lon, point.lat]));
      // Room on the right for the zoom buttons and below for the attribution.
      instance.fitBounds(bounds, {
        padding: { top: 48, right: 72, bottom: 56, left: 48 },
        maxZoom: MAX_FIT_ZOOM,
        duration: 0,
      });
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [key]);

  return (
    <div className="relative">
      {imagery && (
        <div
          role="group"
          aria-label="Map view"
          className="absolute top-2.5 left-2.5 z-10 flex gap-0.5 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0.5 shadow-[var(--hui-shadow-soft)]"
        >
          {(["satellite", "map"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                "rounded-[var(--hui-radius-1)] px-2.5 py-1 text-xs font-medium outline-none focus-visible:[outline:var(--hui-focus-ring)]",
                view === option
                  ? "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)]"
                  : "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]",
              )}
            >
              {option === "satellite" ? imagery.label : "Map"}
            </button>
          ))}
        </div>
      )}
      <div
        ref={container}
        role="region"
        aria-label={label}
        className="aspect-[4/3] max-h-96 w-full bg-[var(--hui-color-background-base-secondary)] sm:aspect-[16/9]"
      />
    </div>
  );
}
