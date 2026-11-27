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
import { Halftone, type HalftoneMode, type HalftoneShape } from "honestui/shaders";

const sources = [
  { label: "Procedural field", value: "procedural", src: undefined, alt: undefined },
  {
    label: "Alpine dusk",
    value: "alpine",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
  },
  {
    label: "Color-blocked city",
    value: "city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
  },
] as const;

interface HalftoneSettings {
  source: string;
  mode: HalftoneMode;
  shape: HalftoneShape;
  cellSize: number;
  angle: number;
  dotScale: number;
  contrast: number;
  brightness: number;
  roughness: number;
  inkColor: string;
  paperColor: string;
  animated: boolean;
}

const defaults: HalftoneSettings = {
  source: "procedural",
  mode: "mono",
  shape: "circle",
  cellSize: 8,
  angle: 45,
  dotScale: 1,
  contrast: 1.1,
  brightness: 0,
  roughness: 0.15,
  inkColor: "#16181d",
  paperColor: "#f4f1ea",
  animated: true,
};

export default function HalftoneDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const source = sources.find((item) => item.value === settings.source) ?? sources[0];
  const { source: _source, ...props } = settings;
  void _source;
  const code = buildShaderCode({
    componentName: "Halftone",
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
          <Halftone className="size-full" src={source.src} alt={source.alt} {...props} />
        ) : (
          <Halftone className="size-full" {...props} />
        )
      }
      title="Halftone"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Source"
        onChange={(value) => update("source", value)}
        options={sources.map(({ label, value }) => ({ label, value }))}
        value={settings.source}
      />
      <ShaderSelectControl
        label="Mode"
        onChange={(value) => update("mode", value as HalftoneMode)}
        options={[
          { label: "Mono", value: "mono" },
          { label: "Color", value: "color" },
          { label: "CMYK", value: "cmyk" },
        ]}
        value={settings.mode}
      />
      <ShaderSelectControl
        label="Shape"
        onChange={(value) => update("shape", value as HalftoneShape)}
        options={[
          { label: "Circle", value: "circle" },
          { label: "Square", value: "square" },
          { label: "Line", value: "line" },
        ]}
        value={settings.shape}
      />
      <ShaderColorControl label="Ink" onChange={(value) => update("inkColor", value)} value={settings.inkColor} />
      <ShaderColorControl label="Paper" onChange={(value) => update("paperColor", value)} value={settings.paperColor} />
      <ShaderSliderControl label="Cell size" max={32} min={3} onChange={(value) => update("cellSize", value)} step={1} value={settings.cellSize} />
      <ShaderSliderControl label="Angle" max={90} min={0} onChange={(value) => update("angle", value)} step={1} value={settings.angle} />
      <ShaderSliderControl label="Dot scale" max={1.6} min={0.2} onChange={(value) => update("dotScale", value)} step={0.05} value={settings.dotScale} />
      <ShaderSliderControl label="Contrast" max={2} min={0.4} onChange={(value) => update("contrast", value)} step={0.05} value={settings.contrast} />
      <ShaderSliderControl label="Brightness" max={0.5} min={-0.5} onChange={(value) => update("brightness", value)} step={0.01} value={settings.brightness} />
      <ShaderSliderControl label="Roughness" max={1} min={0} onChange={(value) => update("roughness", value)} step={0.05} value={settings.roughness} />
      <ShaderSwitchControl checked={settings.animated} label="Animate procedural source" onChange={(value) => update("animated", value)} />
    </ShaderPlayground>
  );
}
