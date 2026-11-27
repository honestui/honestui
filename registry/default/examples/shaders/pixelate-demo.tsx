"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Pixelate } from "honestui/shaders";

const sources = [
  {
    label: "Color-blocked city",
    value: "city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
  },
  {
    label: "Alpine dusk",
    value: "alpine",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
  },
  { label: "Procedural field", value: "procedural", src: undefined, alt: undefined },
] as const;

interface PixelateSettings {
  source: string;
  pixelSize: number;
  glitch: number;
  glitchRate: number;
  colorSplit: number;
  scanlines: number;
  colorLevels: number;
  reveal: boolean;
  revealRadius: number;
}

const defaults: PixelateSettings = {
  source: "city",
  pixelSize: 12,
  glitch: 0.35,
  glitchRate: 1,
  colorSplit: 1,
  scanlines: 0.25,
  colorLevels: 0,
  reveal: true,
  revealRadius: 120,
};

export default function PixelateDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const source = sources.find((item) => item.value === settings.source) ?? sources[0];
  const { source: _source, ...props } = settings;
  void _source;
  const code = buildShaderCode({
    componentName: "Pixelate",
    props: [
      ...(source.src ? ([["src", source.src], ["alt", source.alt]] as const) : []),
      ...(Object.entries(props) as [string, string | number | boolean][]),
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        source.src ? (
          <Pixelate className="size-full" src={source.src} alt={source.alt} {...props} />
        ) : (
          <Pixelate className="size-full" {...props} />
        )
      }
      title="Pixelate"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Source"
        onChange={(value) => update("source", value)}
        options={sources.map(({ label, value }) => ({ label, value }))}
        value={settings.source}
      />
      <ShaderSliderControl label="Pixel size" max={48} min={1} onChange={(value) => update("pixelSize", value)} step={1} value={settings.pixelSize} />
      <ShaderSliderControl label="Glitch" max={1} min={0} onChange={(value) => update("glitch", value)} step={0.05} value={settings.glitch} />
      <ShaderSliderControl label="Glitch rate" max={4} min={0.2} onChange={(value) => update("glitchRate", value)} step={0.1} value={settings.glitchRate} />
      <ShaderSliderControl label="Color split" max={8} min={0} onChange={(value) => update("colorSplit", value)} step={0.5} value={settings.colorSplit} />
      <ShaderSliderControl label="Scanlines" max={1} min={0} onChange={(value) => update("scanlines", value)} step={0.05} value={settings.scanlines} />
      <ShaderSliderControl label="Color levels" max={16} min={0} onChange={(value) => update("colorLevels", value)} step={1} value={settings.colorLevels} formatValue={(value) => (value < 2 ? "Full" : String(value))} />
      <ShaderSliderControl label="Reveal radius" max={300} min={40} onChange={(value) => update("revealRadius", value)} step={10} value={settings.revealRadius} />
      <ShaderSwitchControl checked={settings.reveal} label="Sharpen near pointer" onChange={(value) => update("reveal", value)} />
    </ShaderPlayground>
  );
}
