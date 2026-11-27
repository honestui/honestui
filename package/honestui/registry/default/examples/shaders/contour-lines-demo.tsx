"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { ContourLines, type ContourLinesProps } from "honestui/shaders";

type Fade = NonNullable<ContourLinesProps["fade"]>;

interface ContourLinesSettings {
  color: string;
  opacity: number;
  lineWidth: number;
  levels: number;
  majorEvery: number;
  scale: number;
  fade: Fade;
  speed: number;
  paused: boolean;
}

const defaults: ContourLinesSettings = {
  color: "currentColor",
  opacity: 0.35,
  lineWidth: 1,
  levels: 14,
  majorEvery: 5,
  scale: 1,
  fade: "radial",
  speed: 1,
  paused: false,
};

export default function ContourLinesDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "ContourLines",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <ContourLines className="absolute inset-0" {...settings} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="text-foreground text-2xl font-medium tracking-tight">Know the terrain.</p>
          </div>
        </div>
      }
      title="Contour Lines"
    >
      <ShaderSelectControl
        label="Fade"
        onChange={(value) => update("fade", value as Fade)}
        options={[
          { label: "None", value: "none" },
          { label: "Radial", value: "radial" },
          { label: "Edges", value: "edges" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ]}
        value={settings.fade}
      />
      <ShaderSliderControl label="Levels" max={40} min={3} onChange={(value) => update("levels", value)} step={1} value={settings.levels} />
      <ShaderSliderControl label="Major every" max={10} min={0} onChange={(value) => update("majorEvery", value)} step={1} value={settings.majorEvery} />
      <ShaderSliderControl label="Line width" max={4} min={0.5} onChange={(value) => update("lineWidth", value)} step={0.25} value={settings.lineWidth} />
      <ShaderSliderControl label="Opacity" max={1} min={0.05} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Scale" max={3} min={0.3} onChange={(value) => update("scale", value)} step={0.05} value={settings.scale} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
