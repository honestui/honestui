// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import {
  EventType,
  GenerativeChat,
  agUIAdapter,
  type ChatLLM,
} from "@/registry/honest-ai/generative/chat";
import chatSpec from "@/registry/honest-ai/generative/chat-spec.json";
import { MapServicesContext, type MapServices } from "@/registry/honest-ai/generative";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no WebGL. The stub records what the map would draw, or fails the
// way a browser without WebGL does; the browser test draws a real map.
const drawn = vi.hoisted(() => ({ points: [] as unknown[], fail: false, imageryCovers: undefined as boolean | undefined }));
vi.mock("@/registry/honest-ai/generative/renderers/map-canvas", async () => {
  const React = await import("react");
  function StubMapCanvas({ points, label, onFail, imageryCovers }: { points: unknown[]; label: string; onFail: () => void; imageryCovers: boolean }) {
    drawn.imageryCovers = imageryCovers;
    React.useEffect(() => {
      if (drawn.fail) onFail();
    }, [onFail]);
    drawn.points = points;
    return React.createElement("div", { role: "region", "aria-label": label });
  }
  return { default: StubMapCanvas };
});

afterEach(() => {
  document.body.innerHTML = "";
  drawn.points = [];
  drawn.fail = false;
});

function replyWith(text: string): ChatLLM {
  return {
    streamProtocol: agUIAdapter(),
    send: async () =>
      new Response(
        [
          { type: EventType.TEXT_MESSAGE_START, messageId: "r", role: "assistant" },
          { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "r", delta: text },
          { type: EventType.TEXT_MESSAGE_END, messageId: "r" },
        ]
          .map((event) => `data: ${JSON.stringify(event)}\n\n`)
          .join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
  };
}

const example = chatSpec.examples.find((text) => text.includes("Map(["))!;
const program = example.split("```honestai\n")[1].split("\n```")[0];

const places: Record<string, { lat: number; lon: number; label: string } | null> = {
  "Denver, Colorado, USA": { lat: 39.74, lon: -104.99, label: "Denver, Colorado, United States" },
  "Arches National Park, Utah, USA": { lat: 38.73, lon: -109.59, label: "Arches National Park, Grand County, Utah, United States" },
  "Moab, Utah, USA": null,
};

function services(geocode: MapServices["geocode"]): MapServices {
  return {
    geocode,
    workerUrl: "/worker.mjs",
    styles: { light: "light.json", dark: "dark.json" },
    placeAttribution: "Place data © OpenStreetMap contributors",
  };
}

async function renderMap(mapServices: MapServices | null) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () =>
    root.render(
      <MapServicesContext.Provider value={mapServices}>
        <GenerativeChat llm={replyWith(program)} />
      </MapServicesContext.Provider>,
    ),
  );
  const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Plan it");
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  // Lookups settle, then the lazy canvas loads.
  await React.act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  return container.querySelectorAll('[data-slot="chat-message"]')[1] as HTMLElement;
}

it("lists the places, says why, and maps nothing when the app has no map services", async () => {
  const reply = await renderMap(null);
  expect(reply.textContent).toContain("Maps aren't set up in this app, so the places are listed instead.");
  expect([...reply.querySelectorAll("ol > li")].map((item) => item.textContent)).toEqual([
    "1DenverStart",
    "2Arches National ParkDelicate Arch trail",
    "3MoabOvernight",
  ]);
  expect(reply.querySelector('[role="region"]')).toBeNull();
});

it("maps the places it finds, numbered in order, and says which one it could not find", async () => {
  const geocode = vi.fn(async (query: string) => places[query]);
  const reply = await renderMap(services(geocode));
  expect(geocode.mock.calls.map(([query]) => query)).toEqual(Object.keys(places));
  // Only found places are drawn, and they keep their stop numbers.
  expect(drawn.points).toEqual([
    { lat: 39.74, lon: -104.99, mark: "1" },
    { lat: 38.73, lon: -109.59, mark: "2" },
  ]);
  expect(reply.querySelector('[role="region"]')?.getAttribute("aria-label")).toBe(
    "Map of 2 places. The same places are listed below.",
  );
  const items = [...reply.querySelectorAll("ol > li")].map((item) => item.textContent);
  // What the lookup matched is shown, so a wrong match is visible.
  expect(items[1]).toContain("Matched: Arches National Park, Grand County, Utah, United States");
  expect(items[2]).toContain("Not found, so it isn't on the map.");
  expect(reply.textContent).toContain("Place data © OpenStreetMap contributors");
  expect(reply.querySelector("figcaption")?.textContent).toContain("doesn't draw the roads");
});

it("reports a failed lookup and looks the places up again on retry", async () => {
  let failing = true;
  const geocode = vi.fn(async (query: string) => {
    if (failing) throw new Error("Place lookups are busy. Try again in a few seconds.");
    return places[query];
  });
  const reply = await renderMap(services(geocode));
  const alert = reply.querySelector('[role="alert"]')!;
  expect(alert.textContent).toContain("Place lookups are busy.");
  failing = false;
  await React.act(async () => (alert.querySelector("button") as HTMLButtonElement).click());
  await React.act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  expect(reply.querySelector('[role="alert"]')).toBeNull();
  expect(geocode).toHaveBeenCalledTimes(6);
  expect(drawn.points).toHaveLength(2);
});

it("keeps the list when the browser cannot draw the map", async () => {
  drawn.fail = true;
  const reply = await renderMap(services(async (query) => places[query]));
  expect(reply.textContent).toContain("The map couldn't load in this browser. The places are listed below.");
  expect(reply.querySelector('[role="region"]')).toBeNull();
  expect(reply.querySelectorAll("ol > li")).toHaveLength(3);
});

it("opens on imagery only where the imagery has a tile at every place", async () => {
  const imagery = { tiles: ["https://imagery.example/{z}/{x}/{y}.png"], maxzoom: 16, attribution: "Imagery", label: "Satellite" };
  const geocode = async (query: string) => places[query];
  // Tiles exist around Denver but not around Arches, as at an imagery border.
  const tileFetch = vi.fn(async (url: string) => new Response(null, { status: url.includes("/12/853/") ? 200 : 404 }));
  vi.stubGlobal("fetch", tileFetch);
  try {
    await renderMap({ ...services(geocode), imagery });
    expect(tileFetch.mock.calls.map(([url]) => url)).toEqual([
      "https://imagery.example/12/853/1554.png",
      "https://imagery.example/12/801/1569.png",
    ]);
    expect(drawn.imageryCovers).toBe(false);
  } finally {
    vi.unstubAllGlobals();
  }
});
