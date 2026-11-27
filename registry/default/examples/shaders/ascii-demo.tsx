"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  ShaderTextControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Ascii, type AsciiColorMode } from "honestui/shaders";

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

interface AsciiSettings {
  source: string;
  characters: string;
  cellSize: number;
  colorMode: AsciiColorMode;
  color: string;
  backgroundColor: string;
  contrast: number;
  brightness: number;
  animated: boolean;
}

const defaults: AsciiSettings = {
  source: "procedural",
  characters: " .:-=+*#%@",
  cellSize: 12,
  colorMode: "mono",
  color: "#e8ecf4",
  backgroundColor: "#0b0d12",
  contrast: 1.35,
  brightness: 0,
  animated: true,
};

export default function AsciiDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const source = sources.find((item) => item.value === settings.source) ?? sources[0];
  const { source: _source, ...props } = settings;
  void _source;
  const code = buildShaderCode({
    componentName: "Ascii",
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
          <Ascii className="size-full" src={source.src} alt={source.alt} {...props} />
        ) : (
          <Ascii className="size-full" {...props} />
        )
      }
      title="ASCII"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Source"
        onChange={(value) => update("source", value)}
        options={sources.map(({ label, value }) => ({ label, value }))}
        value={settings.source}
      />
      <ShaderTextControl
        className="col-span-2"
        label="Characters, light to dense"
        onChange={(value) => update("characters", value)}
        value={settings.characters}
      />
      <ShaderSelectControl
        label="Color mode"
        onChange={(value) => update("colorMode", value as AsciiColorMode)}
        options={[
          { label: "Mono", value: "mono" },
          { label: "Source color", value: "source" },
        ]}
        value={settings.colorMode}
      />
      <ShaderSliderControl label="Cell size" max={32} min={6} onChange={(value) => update("cellSize", value)} step={1} value={settings.cellSize} />
      <ShaderColorControl label="Glyph color" onChange={(value) => update("color", value)} value={settings.color} />
      <ShaderColorControl label="Background" onChange={(value) => update("backgroundColor", value)} value={settings.backgroundColor} />
      <ShaderSliderControl label="Contrast" max={2.5} min={0.4} onChange={(value) => update("contrast", value)} step={0.05} value={settings.contrast} />
      <ShaderSliderControl label="Brightness" max={0.5} min={-0.5} onChange={(value) => update("brightness", value)} step={0.01} value={settings.brightness} />
      <ShaderSwitchControl checked={settings.animated} label="Animate procedural source" onChange={(value) => update("animated", value)} />
    </ShaderPlayground>
  );
}
