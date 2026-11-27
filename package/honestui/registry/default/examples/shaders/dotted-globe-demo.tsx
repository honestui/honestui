"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { DottedGlobe } from "honestui/shaders";

interface DottedGlobeSettings {
  accentColor: string;
  opacity: number;
  dotSize: number;
  density: number;
  backOpacity: number;
  tilt: number;
  speed: number;
  interactive: boolean;
  paused: boolean;
}

const defaults: DottedGlobeSettings = {
  accentColor: "#3b82f6",
  opacity: 0.75,
  dotSize: 0.38,
  density: 56,
  backOpacity: 0.08,
  tilt: 18,
  speed: 1,
  interactive: true,
  paused: false,
};

export default function DottedGlobeDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "DottedGlobe",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <DottedGlobe className="absolute inset-0" {...settings} />
        </div>
      }
      title="Dotted Globe"
    >
      <ShaderSliderControl label="Density" max={120} min={16} onChange={(value) => update("density", value)} step={2} value={settings.density} />
      <ShaderSliderControl label="Dot size" max={0.9} min={0.1} onChange={(value) => update("dotSize", value)} step={0.02} value={settings.dotSize} />
      <ShaderSliderControl label="Opacity" max={1} min={0.1} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Back opacity" max={0.5} min={0} onChange={(value) => update("backOpacity", value)} step={0.01} value={settings.backOpacity} />
      <ShaderSliderControl label="Tilt" max={60} min={-60} onChange={(value) => update("tilt", value)} step={1} value={settings.tilt} />
      <ShaderSliderControl label="Speed" max={4} min={-4} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
      <ShaderColorControl label="Accent color" onChange={(value) => update("accentColor", value)} value={settings.accentColor} />
      <ShaderSwitchControl checked={settings.interactive} label="Drag to turn" onChange={(value) => update("interactive", value)} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
