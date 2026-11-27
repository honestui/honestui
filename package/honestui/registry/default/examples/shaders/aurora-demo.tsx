"use client";

import {
  buildShaderCode,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Aurora } from "honestui/shaders";

interface AuroraSettings {
  colorStops: string[];
  amplitude: number;
  blend: number;
  intensity: number;
  height: number;
  speed: number;
  paused: boolean;
}

const defaults: AuroraSettings = {
  colorStops: ["#7ee0c3", "#6aa8f0", "#a58cf0"],
  amplitude: 1,
  blend: 0.5,
  intensity: 0.85,
  height: 0.55,
  speed: 1,
  paused: false,
};

export default function AuroraDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Aurora",
    props: Object.entries(settings) as [keyof AuroraSettings, AuroraSettings[keyof AuroraSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#0b0f1a]">
          <Aurora className="size-full" {...settings} />
        </div>
      }
      title="Aurora"
    >
      <ShaderColorListControl
        label="Color stops"
        maxColors={5}
        minColors={2}
        onChange={(value) => update("colorStops", value)}
        values={settings.colorStops}
      />
      <ShaderSliderControl label="Amplitude" max={2} min={0} onChange={(value) => update("amplitude", value)} step={0.05} value={settings.amplitude} />
      <ShaderSliderControl label="Blend" max={1} min={0} onChange={(value) => update("blend", value)} step={0.01} value={settings.blend} />
      <ShaderSliderControl label="Intensity" max={1} min={0} onChange={(value) => update("intensity", value)} step={0.01} value={settings.intensity} />
      <ShaderSliderControl label="Height" max={0.9} min={0.1} onChange={(value) => update("height", value)} step={0.01} value={settings.height} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
