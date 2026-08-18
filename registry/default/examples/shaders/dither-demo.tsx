"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  type ShaderCodeProp,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import {
  DitherShader,
  type DitherColorMode,
  type DitherSourceMode,
  type DitheringMode,
} from "honestui/shaders";

const exampleImages = [
  {
    label: "Color-blocked city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
  },
  {
    label: "Alpine dusk",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
  },
] as const;

interface DitherSettings {
  sourceMode: DitherSourceMode;
  src: string;
  gridSize: number;
  ditherMode: DitheringMode;
  colorMode: DitherColorMode;
  invert: boolean;
  pixelRatio: number;
  primaryColor: string;
  secondaryColor: string;
  customPalette: string[];
  brightness: number;
  contrast: number;
  backgroundColor: string;
  objectFit: "cover" | "contain" | "fill" | "none";
  threshold: number;
  animated: boolean;
  animationSpeed: number;
  colorCount: number;
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveColor: string;
  enableMouseInteraction: boolean;
  mouseRadius: number;
}

const defaults: DitherSettings = {
  sourceMode: "waves",
  src: exampleImages[0].src,
  gridSize: 4,
  ditherMode: "bayer",
  colorMode: "original",
  invert: false,
  pixelRatio: 1,
  primaryColor: "#111827",
  secondaryColor: "#f97316",
  customPalette: ["#111827", "#38bdf8", "#f8fafc", "#f97316"],
  brightness: 0,
  contrast: 1.1,
  backgroundColor: "#0c0c0c",
  objectFit: "cover",
  threshold: 0.5,
  animated: true,
  animationSpeed: 0.02,
  colorCount: 4,
  waveSpeed: 0.05,
  waveFrequency: 3,
  waveAmplitude: 0.3,
  waveColor: "#a5f3fc",
  enableMouseInteraction: true,
  mouseRadius: 0.35,
};

const ditherModes: readonly DitheringMode[] = [
  "bayer",
  "halftone",
  "noise",
  "crosshatch",
];
const colorModes: readonly DitherColorMode[] = [
  "original",
  "grayscale",
  "duotone",
  "custom",
];
const objectFits: readonly DitherSettings["objectFit"][] = [
  "cover",
  "contain",
  "fill",
  "none",
];

export default function DitherDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const image =
    exampleImages.find((example) => example.src === settings.src) ??
    exampleImages[0];
  const sourceCodeProps: ShaderCodeProp[] =
    settings.sourceMode === "waves"
      ? [
          ["sourceMode", "waves"],
          ["waveSpeed", settings.waveSpeed],
          ["waveFrequency", settings.waveFrequency],
          ["waveAmplitude", settings.waveAmplitude],
          ["waveColor", settings.waveColor],
          ["enableMouseInteraction", settings.enableMouseInteraction],
          ["mouseRadius", settings.mouseRadius],
        ]
      : [
          ["src", image.src],
          ["alt", image.alt],
          ["objectFit", settings.objectFit],
        ];
  const code = buildShaderCode({
    componentName: "DitherShader",
    props: [
      ...sourceCodeProps,
      ["gridSize", settings.gridSize],
      ["ditherMode", settings.ditherMode],
      ["colorMode", settings.colorMode],
      ["invert", settings.invert],
      ["pixelRatio", settings.pixelRatio],
      ["colorCount", settings.colorCount],
      ["primaryColor", settings.primaryColor],
      ["secondaryColor", settings.secondaryColor],
      ["customPalette", settings.customPalette],
      ["brightness", settings.brightness],
      ["contrast", settings.contrast],
      ["backgroundColor", settings.backgroundColor],
      ["threshold", settings.threshold],
      ["animated", settings.animated],
      ["animationSpeed", settings.animationSpeed],
    ],
  });

  const sharedPreviewProps = {
    animated: settings.animated,
    animationSpeed: settings.animationSpeed,
    backgroundColor: settings.backgroundColor,
    brightness: settings.brightness,
    className: "size-full",
    colorCount: settings.colorCount,
    colorMode: settings.colorMode,
    contrast: settings.contrast,
    customPalette: settings.customPalette,
    ditherMode: settings.ditherMode,
    gridSize: settings.gridSize,
    invert: settings.invert,
    pixelRatio: settings.pixelRatio,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    threshold: settings.threshold,
  } as const;

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        settings.sourceMode === "waves" ? (
          <DitherShader
            {...sharedPreviewProps}
            enableMouseInteraction={settings.enableMouseInteraction}
            mouseRadius={settings.mouseRadius}
            sourceMode="waves"
            waveAmplitude={settings.waveAmplitude}
            waveColor={settings.waveColor}
            waveFrequency={settings.waveFrequency}
            waveSpeed={settings.waveSpeed}
          />
        ) : (
          <DitherShader
            {...sharedPreviewProps}
            alt={image.alt}
            objectFit={settings.objectFit}
            src={image.src}
          />
        )
      }
      title="Dither"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Source"
        onChange={(value) =>
          update("sourceMode", value as DitherSourceMode)
        }
        options={[
          { label: "Procedural waves", value: "waves" },
          { label: "Image", value: "image" },
        ]}
        value={settings.sourceMode}
      />
      {settings.sourceMode === "image" ? (
        <ShaderSelectControl
          className="col-span-2"
          label="Example image"
          onChange={(value) => update("src", value)}
          options={exampleImages.map(({ label, src }) => ({
            label,
            value: src,
          }))}
          value={settings.src}
        />
      ) : (
        <>
          <ShaderColorControl
            label="Wave color"
            onChange={(value) => update("waveColor", value)}
            value={settings.waveColor}
          />
          <ShaderSliderControl
            label="Wave speed"
            max={0.25}
            min={0}
            onChange={(value) => update("waveSpeed", value)}
            step={0.01}
            value={settings.waveSpeed}
          />
          <ShaderSliderControl
            label="Wave frequency"
            max={6}
            min={1.1}
            onChange={(value) => update("waveFrequency", value)}
            step={0.1}
            value={settings.waveFrequency}
          />
          <ShaderSliderControl
            label="Wave amplitude"
            max={0.8}
            min={0.05}
            onChange={(value) => update("waveAmplitude", value)}
            step={0.05}
            value={settings.waveAmplitude}
          />
          <ShaderSliderControl
            label="Pointer radius"
            max={1.5}
            min={0.05}
            onChange={(value) => update("mouseRadius", value)}
            step={0.05}
            value={settings.mouseRadius}
          />
          <ShaderSwitchControl
            checked={settings.enableMouseInteraction}
            label="Pointer interaction"
            onChange={(value) => update("enableMouseInteraction", value)}
          />
        </>
      )}
      <ShaderSelectControl
        label="Dither pattern"
        onChange={(value) => update("ditherMode", value as DitheringMode)}
        options={ditherModes.map((value) => ({ label: value, value }))}
        value={settings.ditherMode}
      />
      <ShaderSelectControl
        label="Color mode"
        onChange={(value) => update("colorMode", value as DitherColorMode)}
        options={colorModes.map((value) => ({ label: value, value }))}
        value={settings.colorMode}
      />
      <ShaderColorControl
        label="Primary color"
        onChange={(value) => update("primaryColor", value)}
        value={settings.primaryColor}
      />
      <ShaderColorControl
        label="Secondary color"
        onChange={(value) => update("secondaryColor", value)}
        value={settings.secondaryColor}
      />
      <ShaderColorListControl
        label="Custom palette"
        onChange={(value) => update("customPalette", value)}
        values={settings.customPalette}
      />
      <ShaderColorControl
        label="Background color"
        onChange={(value) => update("backgroundColor", value)}
        value={settings.backgroundColor}
      />
      {settings.sourceMode === "image" ? (
        <ShaderSelectControl
          label="Object fit"
          onChange={(value) =>
            update("objectFit", value as DitherSettings["objectFit"])
          }
          options={objectFits.map((value) => ({ label: value, value }))}
          value={settings.objectFit}
        />
      ) : null}
      <ShaderSliderControl
        label="Grid size"
        max={16}
        min={1}
        onChange={(value) => update("gridSize", value)}
        step={1}
        value={settings.gridSize}
      />
      <ShaderSliderControl
        label="Pixel ratio"
        max={4}
        min={0.5}
        onChange={(value) => update("pixelRatio", value)}
        step={0.5}
        value={settings.pixelRatio}
      />
      <ShaderSliderControl
        label="Color count"
        max={16}
        min={2}
        onChange={(value) => update("colorCount", value)}
        step={1}
        value={settings.colorCount}
      />
      <ShaderSliderControl
        label="Brightness"
        max={1}
        min={-1}
        onChange={(value) => update("brightness", value)}
        step={0.05}
        value={settings.brightness}
      />
      <ShaderSliderControl
        label="Contrast"
        max={2}
        min={0}
        onChange={(value) => update("contrast", value)}
        step={0.05}
        value={settings.contrast}
      />
      <ShaderSliderControl
        label="Threshold"
        max={1}
        min={0}
        onChange={(value) => update("threshold", value)}
        step={0.05}
        value={settings.threshold}
      />
      <ShaderSliderControl
        label="Animation speed"
        max={0.1}
        min={0.005}
        onChange={(value) => update("animationSpeed", value)}
        step={0.005}
        value={settings.animationSpeed}
      />
      <ShaderSwitchControl
        checked={settings.invert}
        label="Invert colors"
        onChange={(value) => update("invert", value)}
      />
      <ShaderSwitchControl
        checked={settings.animated}
        label="Animate pattern"
        onChange={(value) => update("animated", value)}
      />
    </ShaderPlayground>
  );
}
