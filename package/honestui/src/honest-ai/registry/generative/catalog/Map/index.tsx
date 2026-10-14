"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { createElement } from "react";
import { GeneratedComponent } from "../../renderers/generated-component";

import { z } from "zod/v4";
import { defineComponent } from "../../runtime/react/index";

import { MapPlaceSchema } from "./schema";

export { MapPlaceSchema } from "./schema";

export const MapPlace = defineComponent({
  name: "MapPlace",
  props: MapPlaceSchema,
  description:
    'One place. name is shown to the reader; query is what the app searches for: the name, then city or region and country (e.g. "Thompson Library, Columbus, Ohio, USA"), with no campus or institution part; it defaults to name; note is one short line. Never coordinates.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "MapPlace", props, renderNode }),
});

export const PlaceMap = defineComponent({
  name: "Map",
  props: z.object({
    places: z.array(MapPlace.ref),
    kind: z.enum(["route", "points"]),
    caption: z.string().optional(),
  }),
  description:
    'A map of real places that the app looks up by name; you never supply coordinates. "route" numbers the stops in order (no roads are drawn); "points" marks places in no particular order. The places are also listed under the map.',
  component: ({ props, renderNode }) =>
    createElement(GeneratedComponent, { name: "Map", props, renderNode }),
});
