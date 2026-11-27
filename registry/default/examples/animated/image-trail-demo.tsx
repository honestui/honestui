"use client";

import { ImageTrail } from "@/registry/default/animated/image-trail";

// Abstract artwork tiles, drawn as SVG so the demo needs no network images.
const PALETTES: [string, string, string][] = [
  ["#f4d8c4", "#e07a5f", "#3d405b"],
  ["#d8e2dc", "#84a59d", "#2f3e46"],
  ["#e9e3f5", "#9d8df1", "#1f1b3a"],
  ["#fdf0d5", "#f4a259", "#5b2a1c"],
  ["#dbeafe", "#5b8def", "#0f1c3f"],
  ["#f6e7e7", "#d4708f", "#3a1d2b"],
  ["#e6f2ea", "#52b788", "#1b3a2b"],
  ["#f1efe9", "#b8a88a", "#2b2620"],
];

function tile([paper, accent, ink]: [string, string, string], index: number) {
  const shapes = [
    `<circle cx="160" cy="230" r="120" fill="${accent}"/><circle cx="160" cy="230" r="58" fill="${paper}"/>`,
    `<rect x="40" y="70" width="240" height="260" rx="120" fill="${accent}"/><rect x="40" y="200" width="240" height="130" fill="${ink}" opacity=".85"/>`,
    `<path d="M0 400 L160 90 L320 400 Z" fill="${accent}"/><circle cx="230" cy="110" r="36" fill="${ink}"/>`,
    `<circle cx="110" cy="160" r="90" fill="${accent}"/><circle cx="210" cy="260" r="90" fill="${ink}" opacity=".9"/>`,
    `<rect x="0" y="0" width="160" height="400" fill="${accent}"/><circle cx="160" cy="200" r="80" fill="${ink}"/>`,
    `<path d="M0 260 C80 180 240 340 320 260 L320 400 L0 400 Z" fill="${accent}"/><path d="M0 320 C80 260 240 400 320 320 L320 400 L0 400 Z" fill="${ink}"/>`,
    `<rect x="60" y="60" width="200" height="200" rx="28" fill="${accent}" transform="rotate(12 160 160)"/><circle cx="160" cy="300" r="44" fill="${ink}"/>`,
    `<circle cx="160" cy="200" r="130" fill="none" stroke="${accent}" stroke-width="34"/><circle cx="160" cy="200" r="46" fill="${ink}"/>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${paper}"/><stop offset="1" stop-color="${accent}" stop-opacity=".35"/></linearGradient></defs><rect width="320" height="400" fill="${paper}"/><rect width="320" height="400" fill="url(#g)"/>${shapes[index % shapes.length]}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const IMAGES = PALETTES.map((palette, index) => tile(palette, index));

export default function ImageTrailDemo() {
  return (
    <ImageTrail
      images={IMAGES}
      className="h-[26rem] w-full rounded-xl border border-border bg-background"
    >
      <div className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted-foreground">Studio Field · Selected work 2021–2026</p>
        <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Move your cursor</p>
      </div>
    </ImageTrail>
  );
}
