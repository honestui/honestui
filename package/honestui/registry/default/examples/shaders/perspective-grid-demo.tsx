"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { PerspectiveGrid } from "honestui/shaders";

interface PerspectiveGridSettings {
  color: string;
  opacity: number;
  cellSize: number;
  lineWidth: number;
  horizon: number;
  tilt: number;
  fade: number;
  glow: number;
  glowColor: string;
  speed: number;
  paused: boolean;
}

const defaults: PerspectiveGridSettings = {
  color: "currentColor",
  opacity: 0.3,
  cellSize: 64,
  lineWidth: 1,
  horizon: 0.55,
  tilt: 0.5,
  fade: 0.6,
  glow: 0.3,
  glowColor: "#3b82f6",
  speed: 0.35,
  paused: false,
};

export default function PerspectiveGridDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "PerspectiveGrid",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <PerspectiveGrid className="absolute inset-0" {...settings} />
          <div className="pointer-events-none absolute inset-x-0 top-[18%] grid place-items-center gap-2 px-6 text-center">
            <p className="text-foreground text-2xl font-medium tracking-tight sm:text-3xl">Launch week</p>
            <p className="text-muted-foreground text-sm">Five days of new releases.</p>
          </div>
        </div>
      }
      title="Perspective Grid"
    >
      <ShaderSliderControl label="Cell size" max={160} min={16} onChange={(value) => update("cellSize", value)} step={2} value={settings.cellSize} />
      <ShaderSliderControl label="Line width" max={4} min={0.5} onChange={(value) => update("lineWidth", value)} step={0.25} value={settings.lineWidth} />
      <ShaderSliderControl label="Opacity" max={1} min={0.05} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Horizon" max={0.95} min={0.1} onChange={(value) => update("horizon", value)} step={0.01} value={settings.horizon} />
      <ShaderSliderControl label="Tilt" max={1} min={0} onChange={(value) => update("tilt", value)} step={0.01} value={settings.tilt} />
      <ShaderSliderControl label="Fade" max={1} min={0} onChange={(value) => update("fade", value)} step={0.01} value={settings.fade} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSliderControl label="Glow" max={1} min={0} onChange={(value) => update("glow", value)} step={0.01} value={settings.glow} />
      <ShaderColorControl label="Glow color" onChange={(value) => update("glowColor", value)} value={settings.glowColor} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
