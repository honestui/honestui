"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Voronoi } from "honestui/shaders";

interface VoronoiSettings {
  colors: string[];
  edgeColor: string;
  edgeWidth: number;
  glow: number;
  shading: number;
  scale: number;
  jitter: number;
  distortion: number;
  speed: number;
}

const defaults: VoronoiSettings = {
  colors: ["#16181d", "#1c1f26", "#21252e", "#262a35"],
  edgeColor: "#5eead4",
  edgeWidth: 1.5,
  glow: 0.35,
  shading: 0.5,
  scale: 6,
  jitter: 0.85,
  distortion: 0.25,
  speed: 0.5,
};

export default function VoronoiDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Voronoi",
    props: Object.entries(settings) as [keyof VoronoiSettings, VoronoiSettings[keyof VoronoiSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={<Voronoi className="size-full" {...settings} />}
      title="Voronoi"
    >
      <div className="col-span-2">
        <ShaderColorListControl
          label="Cell colors"
          maxColors={8}
          minColors={1}
          onChange={(value) => update("colors", value)}
          values={settings.colors}
        />
      </div>
      <ShaderColorControl label="Edge color" onChange={(value) => update("edgeColor", value)} value={settings.edgeColor} />
      <ShaderSliderControl label="Edge width" max={8} min={0} onChange={(value) => update("edgeWidth", value)} step={0.25} value={settings.edgeWidth} />
      <ShaderSliderControl label="Glow" max={1} min={0} onChange={(value) => update("glow", value)} step={0.01} value={settings.glow} />
      <ShaderSliderControl label="Shading" max={1} min={0} onChange={(value) => update("shading", value)} step={0.01} value={settings.shading} />
      <ShaderSliderControl label="Scale" max={20} min={1} onChange={(value) => update("scale", value)} step={0.5} value={settings.scale} />
      <ShaderSliderControl label="Jitter" max={1} min={0} onChange={(value) => update("jitter", value)} step={0.01} value={settings.jitter} />
      <ShaderSliderControl label="Distortion" max={1} min={0} onChange={(value) => update("distortion", value)} step={0.01} value={settings.distortion} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
    </ShaderPlayground>
  );
}
