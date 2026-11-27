"use client";

import React, { useRef, useState } from "react";
import { CORE_UNIFORMS, effectContainerClass, rgb, useCssColors, useEffectCanvas } from "./effect-canvas";

export interface DottedGlobePoint {
  /** Latitude in degrees, from -90 (south) to 90 (north). */
  lat: number;
  /** Longitude in degrees, from -180 (west) to 180 (east). */
  lng: number;
}

export interface DottedGlobeArc {
  from: DottedGlobePoint;
  to: DottedGlobePoint;
}

export interface DottedGlobeProps {
  /** Dot color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Color of markers and arcs. */
  accentColor?: string;
  /** Opacity of the brightest dots, from 0 to 1. */
  opacity?: number;
  /** Dot diameter as a share of the space between dots, from 0.1 to 0.9. */
  dotSize?: number;
  /** Number of dot rows from pole to pole. */
  density?: number;
  /** Opacity of the dots on the far side, seen through the globe. 0 hides them. */
  backOpacity?: number;
  /** How far the north pole leans toward the viewer, in degrees. */
  tilt?: number;
  /** Longitude facing the viewer at the start, in degrees. */
  rotation?: number;
  /** Rotation speed. 0 holds the globe still; negative values spin the other way. */
  speed?: number;
  /** Up to 16 places drawn as accent dots with a soft pulse. */
  markers?: readonly DottedGlobePoint[];
  /** Up to 8 great-circle arcs lifted above the surface, with a light traveling along each. */
  arcs?: readonly DottedGlobeArc[];
  /** Height of the arcs, from 0 (flat on the surface) to 2. */
  arcHeight?: number;
  /** Let people drag horizontally to turn the globe. */
  interactive?: boolean;
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MAX_MARKERS = 16;
const MAX_ARCS = 8;
const ARC_SEGMENTS = 36;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
#define PI 3.14159265359
#define MAX_MARKERS ${MAX_MARKERS}
#define MAX_ARCS ${MAX_ARCS}
#define ARC_SEGMENTS ${ARC_SEGMENTS}
uniform vec4 uColor;
uniform vec4 uAccent;
uniform float uOpacity;
uniform float uDotSize;
uniform float uDensity;
uniform float uBack;
uniform float uTilt;
uniform float uSpinBase;
uniform float uSpinRate;
uniform vec2 uMarkers[MAX_MARKERS];
uniform int uMarkerCount;
uniform vec4 uArcs[MAX_ARCS];
uniform int uArcCount;
uniform float uArcHeight;
out vec4 fragColor;

float gSpinC;
float gSpinS;
float gTiltC;
float gTiltS;

// Globe space: y is north, longitude 0 faces +z. View space: +z faces the viewer.
vec3 toView(vec3 p) {
  vec3 q = vec3(gSpinC * p.x + gSpinS * p.z, p.y, -gSpinS * p.x + gSpinC * p.z);
  return vec3(q.x, gTiltC * q.y - gTiltS * q.z, gTiltS * q.y + gTiltC * q.z);
}
vec3 toGlobe(vec3 v) {
  vec3 q = vec3(v.x, gTiltC * v.y + gTiltS * v.z, -gTiltS * v.y + gTiltC * v.z);
  return vec3(gSpinC * q.x - gSpinS * q.z, q.y, gSpinS * q.x + gSpinC * q.z);
}
vec3 fromLatLng(vec2 ll) {
  float c = cos(ll.x);
  return vec3(c * sin(ll.y), sin(ll.x), c * cos(ll.y));
}

// Coverage of the nearest lattice dot. Rows are evenly spaced in latitude and
// each row holds as many dots as fit its circumference, with alternate rows
// offset by half a step, so spacing stays even from the equator to the poles.
float lattice(vec3 p, float aa) {
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float lng = atan(p.x, p.z);
  float rowStep = PI / uDensity;
  float row = clamp(floor(lat / rowStep + 0.5), -floor(uDensity * 0.5), floor(uDensity * 0.5));
  float rowLat = row * rowStep;
  float count = max(1.0, floor(2.0 * PI * cos(rowLat) / rowStep + 0.5));
  float lngStep = 2.0 * PI / count;
  float offset = mod(row, 2.0) * 0.5 * lngStep;
  float rowLng = floor((lng - offset) / lngStep + 0.5) * lngStep + offset;
  float d = length(p - fromLatLng(vec2(rowLat, rowLng)));
  float radius = rowStep * 0.5 * uDotSize;
  return 1.0 - smoothstep(radius - aa, radius + aa, d);
}

void over(inout vec4 acc, vec3 color, float alpha) {
  alpha = clamp(alpha, 0.0, 1.0);
  acc.rgb = color * alpha + acc.rgb * (1.0 - alpha);
  acc.a = alpha + acc.a * (1.0 - alpha);
}

float segmentDistance(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float dpr = uPixelRatio;
  float spin = uSpinBase + uTime * uSpinRate;
  gSpinC = cos(spin);
  gSpinS = sin(spin);
  gTiltC = cos(uTilt);
  gTiltS = sin(uTilt);

  vec2 center = uResolution * 0.5;
  float radiusPx = min(uResolution.x, uResolution.y) * 0.5 * 0.86;
  vec2 q = (gl_FragCoord.xy - center) / radiusPx;
  float r2 = dot(q, q);
  float r = sqrt(r2);

  vec4 acc = vec4(0.0);
  vec3 base = uColor.rgb;
  float baseAlpha = uOpacity * uColor.a;

  // A faint halo just outside the edge, so the sphere reads against any surface.
  if (r > 1.0) {
    float halo = exp(-(r - 1.0) * 22.0) * 0.07;
    over(acc, base, halo * baseAlpha / max(uOpacity, 1e-3));
  }

  if (r2 < 1.0) {
    float z = sqrt(1.0 - r2);
    // One pixel spans more of the surface near the edge, where it is foreshortened.
    float aaFront = 1.1 / (radiusPx * max(z, 0.12));

    if (uBack > 0.0) {
      vec3 back = toGlobe(vec3(q, -z));
      float c = lattice(back, aaFront);
      over(acc, base, c * uBack * uColor.a * (0.55 + 0.45 * z));
    }

    vec3 normal = vec3(q, z);
    vec3 front = toGlobe(normal);
    float c = lattice(front, aaFront);
    vec3 light = normalize(vec3(-0.45, 0.55, 0.7));
    float shade = mix(0.32, 1.0, clamp(dot(normal, light) * 0.5 + 0.5, 0.0, 1.0));
    float limb = mix(0.35, 1.0, smoothstep(0.0, 0.35, z));
    over(acc, base, c * baseAlpha * shade * limb);

    // A thin rim inside the edge.
    float rim = smoothstep(0.9, 1.0, r) * (1.0 - smoothstep(0.995, 1.0, r));
    over(acc, base, rim * 0.08 * uColor.a);
  }

  // Arcs: a polyline through the lifted great circle, drawn in screen space and
  // dimmed where the globe hides it. A short light travels from start to end.
  for (int j = 0; j < MAX_ARCS; j++) {
    if (j >= uArcCount) break;
    vec3 a = fromLatLng(uArcs[j].xy);
    vec3 b = fromLatLng(uArcs[j].zw);
    float omega = acos(clamp(dot(a, b), -1.0, 1.0));
    if (omega < 1e-3) continue;
    float lift = (0.04 + 0.34 * omega / PI) * uArcHeight;
    float best = 1e9;
    float bestS = 0.0;
    float bestHidden = 0.0;
    vec3 prevView = toView(a);
    vec2 prev = center + prevView.xy * radiusPx;
    for (int k = 1; k <= ARC_SEGMENTS; k++) {
      float s = float(k) / float(ARC_SEGMENTS);
      vec3 p = (sin((1.0 - s) * omega) * a + sin(s * omega) * b) / sin(omega);
      p *= 1.0 + lift * sin(PI * s);
      vec3 v = toView(p);
      vec2 next = center + v.xy * radiusPx;
      float h;
      float d = segmentDistance(gl_FragCoord.xy, prev, next, h);
      if (d < best) {
        best = d;
        bestS = (float(k - 1) + h) / float(ARC_SEGMENTS);
        vec3 m = mix(prevView, v, h);
        bestHidden = m.z < 0.0 ? 1.0 - smoothstep(0.985, 1.02, length(m.xy)) : 0.0;
      }
      prev = next;
      prevView = v;
    }
    float halfWidth = 0.8 * dpr;
    float line = 1.0 - smoothstep(halfWidth - 0.6, halfWidth + 0.6, best);
    float head = fract(uTime * 0.22 + float(j) * 0.37) * 1.5 - 0.25;
    float trail = smoothstep(head - 0.3, head, bestS) * step(bestS, head);
    float alpha = line * (0.3 + 0.7 * trail) * mix(1.0, 0.12, bestHidden);
    over(acc, uAccent.rgb, alpha * uAccent.a);
  }

  // Markers: a solid dot and a ring that grows and fades.
  float markerRadius = max(PI / uDensity * radiusPx * 0.32, 2.2 * dpr);
  for (int i = 0; i < MAX_MARKERS; i++) {
    if (i >= uMarkerCount) break;
    vec3 v = toView(fromLatLng(uMarkers[i]));
    float visible = mix(min(uBack * 2.0, 0.35), 1.0, smoothstep(-0.06, 0.06, v.z));
    float d = length(gl_FragCoord.xy - (center + v.xy * radiusPx));
    float dotAlpha = 1.0 - smoothstep(markerRadius - 0.75, markerRadius + 0.75, d);
    float phase = fract(uTime * 0.45 + float(i) * 0.173);
    float ringRadius = markerRadius * (1.4 + phase * 3.2);
    float ring = (1.0 - smoothstep(0.5 * dpr, 1.3 * dpr, abs(d - ringRadius))) * (1.0 - phase) * 0.6;
    over(acc, uAccent.rgb, max(dotAlpha, ring) * visible * uAccent.a);
  }

  fragColor = acc.a > 0.0 ? vec4(acc.rgb / acc.a, acc.a) : vec4(0.0);
}
`;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function packMarkers(markers: readonly DottedGlobePoint[]) {
  const values = new Array<number>(MAX_MARKERS * 2).fill(0);
  markers.slice(0, MAX_MARKERS).forEach((marker, index) => {
    values[index * 2] = toRadians(marker.lat);
    values[index * 2 + 1] = toRadians(marker.lng);
  });
  return values;
}

function packArcs(arcs: readonly DottedGlobeArc[]) {
  const values = new Array<number>(MAX_ARCS * 4).fill(0);
  arcs.slice(0, MAX_ARCS).forEach((arc, index) => {
    values[index * 4] = toRadians(arc.from.lat);
    values[index * 4 + 1] = toRadians(arc.from.lng);
    values[index * 4 + 2] = toRadians(arc.to.lat);
    values[index * 4 + 3] = toRadians(arc.to.lng);
  });
  return values;
}

const NO_POINTS: readonly DottedGlobePoint[] = [];
const NO_ARCS: readonly DottedGlobeArc[] = [];

export function DottedGlobe({
  color = "currentColor",
  accentColor = "#3b82f6",
  opacity = 0.75,
  dotSize = 0.38,
  density = 56,
  backOpacity = 0.08,
  tilt = 18,
  rotation = 0,
  speed = 1,
  markers = NO_POINTS,
  arcs = NO_ARCS,
  arcHeight = 1,
  interactive = true,
  paused = false,
  className,
  children,
}: DottedGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragTurn, setDragTurn] = useState(0);
  const dragRef = useRef<{ id: number; x: number } | null>(null);
  const [dot, accent] = useCssColors(containerRef, [color, accentColor]);

  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed !== 0 || markers.length > 0 || arcs.length > 0,
    paused,
    uniforms: {
      uColor: [...rgb(dot), dot[3] ?? 1],
      uAccent: [...rgb(accent), accent[3] ?? 1],
      uOpacity: Math.min(Math.max(opacity, 0), 1),
      uDotSize: Math.min(Math.max(dotSize, 0.1), 0.9),
      uDensity: Math.round(Math.min(Math.max(density, 8), 160)),
      uBack: Math.min(Math.max(backOpacity, 0), 1),
      uTilt: toRadians(Math.min(Math.max(tilt, -90), 90)),
      uSpinBase: -toRadians(rotation) + dragTurn,
      uSpinRate: 0.12 * speed,
      uMarkers: packMarkers(markers),
      uMarkerCount: Math.min(markers.length, MAX_MARKERS),
      uArcs: packArcs(arcs),
      uArcCount: Math.min(arcs.length, MAX_ARCS),
      uArcHeight: Math.min(Math.max(arcHeight, 0), 2),
    },
  });

  const dragHandlers = interactive
    ? {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0) return;
          dragRef.current = { id: event.pointerId, x: event.clientX };
          event.currentTarget.setPointerCapture(event.pointerId);
        },
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          const drag = dragRef.current;
          if (!drag || drag.id !== event.pointerId) return;
          const size = Math.min(event.currentTarget.clientWidth, event.currentTarget.clientHeight) || 1;
          const delta = event.clientX - drag.x;
          drag.x = event.clientX;
          // Dragging across the globe's diameter turns it about half a revolution.
          setDragTurn((turn) => turn + (delta / size) * Math.PI * 1.15);
        },
        onPointerUp: () => {
          dragRef.current = null;
        },
        onPointerCancel: () => {
          dragRef.current = null;
        },
      }
    : {};

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(
        className,
        interactive ? "cursor-grab touch-pan-y select-none active:cursor-grabbing" : "",
      )}
      {...dragHandlers}
    >
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default DottedGlobe;
