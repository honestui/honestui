"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Water } from "honestui/shaders";

interface WaterSettings {
  src: string;
  deepColor: string;
  shallowColor: string;
  highlightColor: string;
  intensity: number;
  scale: number;
  distortion: number;
  dispersion: number;
  speed: number;
  ripples: boolean;
}

const surfaceOptions = [
  { label: "Color gradient", value: "none" },
  {
    label: "Alpine dusk photo",
    value: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
  },
] as const;

const defaults: WaterSettings = {
  src: "none",
  deepColor: "#0b3a4f",
  shallowColor: "#1d7a8c",
  highlightColor: "#e6fbff",
  intensity: 1,
  scale: 1,
  distortion: 0.6,
  dispersion: 0.3,
  speed: 1,
  ripples: true,
};

export default function WaterDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  // The gradient colors only apply without an image, so they're left out of
  // the generated code when a photo is chosen, and src when it is not.
  const hasImage = settings.src !== "none";
  const entries = Object.entries(settings) as [keyof WaterSettings, WaterSettings[keyof WaterSettings]][];
  const code = buildShaderCode({
    componentName: "Water",
    props: entries.filter(([name]) =>
      hasImage ? name !== "deepColor" && name !== "shallowColor" : name !== "src",
    ),
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={<Water className="size-full" {...settings} src={hasImage ? settings.src : undefined} />}
      title="Water"
    >
      <ShaderSelectControl
        label="Beneath the water"
        onChange={(value) => update("src", value)}
        options={surfaceOptions}
        value={settings.src}
      />
      <ShaderSwitchControl checked={settings.ripples} label="Pointer ripples" onChange={(value) => update("ripples", value)} />
      <ShaderColorControl label="Deep color" onChange={(value) => update("deepColor", value)} value={settings.deepColor} />
      <ShaderColorControl label="Shallow color" onChange={(value) => update("shallowColor", value)} value={settings.shallowColor} />
      <ShaderColorControl label="Highlight" onChange={(value) => update("highlightColor", value)} value={settings.highlightColor} />
      <ShaderSliderControl label="Intensity" max={2} min={0} onChange={(value) => update("intensity", value)} step={0.05} value={settings.intensity} />
      <ShaderSliderControl label="Scale" max={3} min={0.3} onChange={(value) => update("scale", value)} step={0.05} value={settings.scale} />
      <ShaderSliderControl label="Distortion" max={1.5} min={0} onChange={(value) => update("distortion", value)} step={0.05} value={settings.distortion} />
      <ShaderSliderControl label="Dispersion" max={1} min={0} onChange={(value) => update("dispersion", value)} step={0.01} value={settings.dispersion} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
    </ShaderPlayground>
  );
}
