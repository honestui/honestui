"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { FlutedGlass } from "honestui/shaders";

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

interface FlutedGlassSettings {
  source: string;
  fluteSize: number;
  angle: number;
  distortion: number;
  frost: number;
  shading: number;
  highlight: number;
  dispersion: number;
  speed: number;
  animated: boolean;
}

const defaults: FlutedGlassSettings = {
  source: "procedural",
  fluteSize: 36,
  angle: 0,
  distortion: 0.55,
  frost: 0.25,
  shading: 0.5,
  highlight: 0.6,
  dispersion: 0.3,
  speed: 0.6,
  animated: true,
};

export default function FlutedGlassDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const source = sources.find((item) => item.value === settings.source) ?? sources[0];
  const { source: _source, ...props } = settings;
  void _source;
  const code = buildShaderCode({
    componentName: "FlutedGlass",
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
          <FlutedGlass className="size-full" src={source.src} alt={source.alt} {...props} />
        ) : (
          <FlutedGlass className="size-full" {...props} />
        )
      }
      title="Fluted Glass"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Source"
        onChange={(value) => update("source", value)}
        options={sources.map(({ label, value }) => ({ label, value }))}
        value={settings.source}
      />
      <ShaderSliderControl label="Flute size" max={120} min={8} onChange={(value) => update("fluteSize", value)} step={1} value={settings.fluteSize} />
      <ShaderSliderControl label="Angle" max={90} min={-90} onChange={(value) => update("angle", value)} step={1} value={settings.angle} />
      <ShaderSliderControl label="Distortion" max={1} min={0} onChange={(value) => update("distortion", value)} step={0.01} value={settings.distortion} />
      <ShaderSliderControl label="Frost" max={1} min={0} onChange={(value) => update("frost", value)} step={0.01} value={settings.frost} />
      <ShaderSliderControl label="Shading" max={1} min={0} onChange={(value) => update("shading", value)} step={0.01} value={settings.shading} />
      <ShaderSliderControl label="Highlight" max={1} min={0} onChange={(value) => update("highlight", value)} step={0.01} value={settings.highlight} />
      <ShaderSliderControl label="Dispersion" max={1} min={0} onChange={(value) => update("dispersion", value)} step={0.01} value={settings.dispersion} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.animated} label="Drift" onChange={(value) => update("animated", value)} />
    </ShaderPlayground>
  );
}
