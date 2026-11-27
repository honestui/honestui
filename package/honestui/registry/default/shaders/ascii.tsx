"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CORE_UNIFORMS,
  NOISE_GLSL,
  SOURCE_GLSL,
  rgb,
  useCssColors,
  effectContainerClass,
  useEffectCanvas,
} from "./effect-canvas";

export type AsciiColorMode = "mono" | "source";

interface AsciiBaseProps {
  /** Glyphs from lightest to densest ink. The first is usually a space. */
  characters?: string;
  /** Height of one character cell in CSS pixels. */
  cellSize?: number;
  /** Font used to draw the glyph atlas. A monospace stack reads best. */
  fontFamily?: string;
  /** Font weight used to draw the glyph atlas. */
  fontWeight?: number | string;
  /** `mono` draws every glyph in `color`; `source` tints each glyph with the source color. */
  colorMode?: AsciiColorMode;
  /** Glyph color in mono mode. Any CSS color. */
  color?: string;
  /** Background color. Any CSS color. */
  backgroundColor?: string;
  /** Tone contrast applied to the source before mapping to glyphs. */
  contrast?: number;
  /** Brightness offset applied to the source, from -1 to 1. */
  brightness?: number;
  /** Animate the procedural source. Images stay still. */
  animated?: boolean;
  /** Speed of the procedural source. */
  speed?: number;
  /** Colors of the procedural source used when there is no image. */
  sourceColors?: [string, string, string];
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface AsciiImageProps {
  /** Image to render as text. It must allow cross-origin use. */
  src: string;
  /** Alternative text for the image; an empty string for decorative images. */
  alt: string;
}

interface AsciiProceduralProps {
  src?: undefined;
  alt?: undefined;
}

export type AsciiProps = AsciiBaseProps & (AsciiImageProps | AsciiProceduralProps);

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform sampler2D uAtlas;
uniform float uGlyphCount;
uniform float uCellSize;
uniform float uCharAspect;
uniform vec3 uForeground;
uniform vec3 uBackground;
uniform float uColorMode;
uniform float uDensityFromLight;
uniform float uContrast;
uniform float uBrightness;
uniform float uSpeed;
out vec4 fragColor;
${NOISE_GLSL}
${SOURCE_GLSL}

void main() {
  vec2 cell = vec2(uCellSize * uCharAspect, uCellSize) * uPixelRatio;
  // Center the grid so partial cells split evenly on both edges.
  vec2 offset = mod(uResolution, cell) * 0.5;
  vec2 p = (gl_FragCoord.xy - offset) / cell;
  vec2 id = floor(p);
  vec2 local = fract(p);
  vec2 center = (id + 0.5) * cell + offset;

  vec3 source = sampleSource(center / uResolution, uTime * uSpeed).rgb;
  source = clamp((source - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
  float light = luminance(source);
  float density = uDensityFromLight > 0.5 ? light : 1.0 - light;
  float index = min(floor(density * uGlyphCount), uGlyphCount - 1.0);

  vec2 atlasUv = vec2((index + local.x) / uGlyphCount, 1.0 - local.y);
  float glyph = texture(uAtlas, atlasUv).a;

  vec3 ink = uColorMode < 0.5 ? uForeground : clamp(source * 1.15 + 0.04, 0.0, 1.0);
  fragColor = vec4(mix(uBackground, ink, glyph), 1.0);
}
`;

const DEFAULT_CHARACTERS = " .:-=+*#%@";
const DEFAULT_FONT = 'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';
const ATLAS_HEIGHT = 64;

type Atlas = { canvas: HTMLCanvasElement; count: number; aspect: number };

function buildAtlas(characters: string, fontFamily: string, fontWeight: number | string): Atlas | null {
  const glyphs = Array.from(characters.length ? characters : DEFAULT_CHARACTERS);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  const fontSize = ATLAS_HEIGHT * 0.86;
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.font = font;
  const aspect = Math.min(
    Math.max(context.measureText("M").width / ATLAS_HEIGHT, 0.4),
    1,
  );
  const width = Math.round(ATLAS_HEIGHT * aspect);
  canvas.width = width * glyphs.length;
  canvas.height = ATLAS_HEIGHT;
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  glyphs.forEach((glyph, index) => {
    context.fillText(glyph, index * width + width / 2, ATLAS_HEIGHT / 2 + ATLAS_HEIGHT * 0.03);
  });
  return { canvas, count: glyphs.length, aspect };
}

export function Ascii({
  src,
  alt,
  characters = DEFAULT_CHARACTERS,
  cellSize = 12,
  fontFamily = DEFAULT_FONT,
  fontWeight = 500,
  colorMode = "mono",
  color = "#e8ecf4",
  backgroundColor = "#0b0d12",
  contrast = 1.35,
  brightness = 0,
  animated = true,
  speed = 0.6,
  sourceColors = ["#05070b", "#34405e", "#f4ead8"],
  paused = false,
  className,
  children,
}: AsciiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [foreground, background, sourceA, sourceB, sourceC] = useCssColors(containerRef, [
    color,
    backgroundColor,
    ...sourceColors,
  ]);

  // The atlas is drawn after web fonts settle so the glyphs use the real face.
  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (!cancelled) setAtlas(buildAtlas(characters, fontFamily, fontWeight));
    };
    draw();
    document.fonts?.ready.then(draw).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [characters, fontFamily, fontWeight]);

  // Light glyphs on a dark background ink the bright areas; dark glyphs on a
  // light background ink the shadows.
  const densityFromLight = luminance(foreground) > luminance(background) ? 1 : 0;

  const { imageReady } = useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    imageSrc: src,
    animated: animated && !src,
    paused,
    textures: { uAtlas: atlas?.canvas },
    uniforms: {
      uGlyphCount: atlas?.count ?? 1,
      uCharAspect: atlas?.aspect ?? 0.6,
      uCellSize: cellSize,
      uForeground: rgb(foreground),
      uBackground: rgb(background),
      uColorMode: colorMode === "source" ? 1 : 0,
      uDensityFromLight: densityFromLight,
      uContrast: contrast,
      uBrightness: brightness,
      uSpeed: speed,
      uSourceA: rgb(sourceA),
      uSourceB: rgb(sourceB),
      uSourceC: rgb(sourceC),
    },
  });

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className)}
      style={{ backgroundColor }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${imageReady && atlas ? "opacity-0" : "opacity-100"}`}
        />
      ) : null}
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

function luminance(color: readonly number[]) {
  return 0.2126 * (color[0] ?? 0) + 0.7152 * (color[1] ?? 0) + 0.0722 * (color[2] ?? 0);
}

export default Ascii;
