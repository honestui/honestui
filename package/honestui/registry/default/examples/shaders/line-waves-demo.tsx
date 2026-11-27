"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { LineWaves, type LineWavesProps } from "honestui/shaders";

type Fade = NonNullable<LineWavesProps["fade"]>;

interface LineWavesSettings {
  lineCount: number;
  lineWidth: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
  occlude: boolean;
  interactive: boolean;
  fade: Fade;
  speed: number;
  paused: boolean;
}

const defaults: LineWavesSettings = {
  lineCount: 48,
  lineWidth: 1,
  amplitude: 1,
  frequency: 1,
  color: "currentColor",
  opacity: 0.7,
  occlude: true,
  interactive: true,
  fade: "edges",
  speed: 1,
  paused: false,
};

export default function LineWavesDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "LineWaves",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <LineWaves className="absolute inset-0" {...settings} />
        </div>
      }
      title="Line Waves"
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
      <ShaderSliderControl label="Lines" max={120} min={4} onChange={(value) => update("lineCount", value)} step={1} value={settings.lineCount} />
      <ShaderSliderControl label="Line width" max={4} min={0.5} onChange={(value) => update("lineWidth", value)} step={0.25} value={settings.lineWidth} />
      <ShaderSliderControl label="Amplitude" max={4} min={0} onChange={(value) => update("amplitude", value)} step={0.05} value={settings.amplitude} />
      <ShaderSliderControl label="Frequency" max={3} min={0.2} onChange={(value) => update("frequency", value)} step={0.05} value={settings.frequency} />
      <ShaderSliderControl label="Opacity" max={1} min={0.05} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.occlude} label="Ridgeline occlusion" onChange={(value) => update("occlude", value)} />
      <ShaderSwitchControl checked={settings.interactive} label="Pointer swell" onChange={(value) => update("interactive", value)} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
