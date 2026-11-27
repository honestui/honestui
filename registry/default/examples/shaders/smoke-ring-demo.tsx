"use client";

import {
  buildShaderCode,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { SmokeRing } from "honestui/shaders";

interface SmokeRingSettings {
  colors: string[];
  radius: number;
  thickness: number;
  noiseScale: number;
  turbulence: number;
  innerGlow: number;
  speed: number;
  paused: boolean;
}

const defaults: SmokeRingSettings = {
  colors: ["#ffffff", "#b4bcfa", "#5560cf"],
  radius: 0.26,
  thickness: 0.45,
  noiseScale: 3,
  turbulence: 0.6,
  innerGlow: 0.35,
  speed: 0.6,
  paused: false,
};

export default function SmokeRingDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "SmokeRing",
    props: Object.entries(settings) as [keyof SmokeRingSettings, SmokeRingSettings[keyof SmokeRingSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#0c0d14]">
          <SmokeRing className="size-full" {...settings} />
        </div>
      }
      title="Smoke Ring"
    >
      <ShaderColorListControl
        label="Colors"
        maxColors={5}
        minColors={1}
        onChange={(value) => update("colors", value)}
        values={settings.colors}
      />
      <ShaderSliderControl label="Radius" max={0.45} min={0.1} onChange={(value) => update("radius", value)} step={0.01} value={settings.radius} />
      <ShaderSliderControl label="Thickness" max={1} min={0} onChange={(value) => update("thickness", value)} step={0.01} value={settings.thickness} />
      <ShaderSliderControl label="Noise scale" max={8} min={0.5} onChange={(value) => update("noiseScale", value)} step={0.1} value={settings.noiseScale} />
      <ShaderSliderControl label="Turbulence" max={1} min={0} onChange={(value) => update("turbulence", value)} step={0.01} value={settings.turbulence} />
      <ShaderSliderControl label="Inner glow" max={1} min={0} onChange={(value) => update("innerGlow", value)} step={0.01} value={settings.innerGlow} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
