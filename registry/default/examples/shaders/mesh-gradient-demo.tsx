"use client";

import {
  buildShaderCode,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { MeshGradient } from "honestui/shaders";

interface MeshGradientSettings {
  colors: string[];
  speed: number;
  distortion: number;
  swirl: number;
  sharpness: number;
  grain: number;
  paused: boolean;
}

const defaults: MeshGradientSettings = {
  colors: ["#f3ebe2", "#e5b9a4", "#9aa9cf", "#3e4a70"],
  speed: 0.5,
  distortion: 0.6,
  swirl: 0.25,
  sharpness: 0.5,
  grain: 0,
  paused: false,
};

export default function MeshGradientDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "MeshGradient",
    props: Object.entries(settings) as [keyof MeshGradientSettings, MeshGradientSettings[keyof MeshGradientSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#9aa9cf]">
          <MeshGradient className="size-full" {...settings} />
        </div>
      }
      title="Mesh Gradient"
    >
      <ShaderColorListControl
        label="Colors"
        maxColors={6}
        minColors={2}
        onChange={(value) => update("colors", value)}
        values={settings.colors}
      />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSliderControl label="Distortion" max={1} min={0} onChange={(value) => update("distortion", value)} step={0.01} value={settings.distortion} />
      <ShaderSliderControl label="Swirl" max={1} min={0} onChange={(value) => update("swirl", value)} step={0.01} value={settings.swirl} />
      <ShaderSliderControl label="Sharpness" max={1} min={0} onChange={(value) => update("sharpness", value)} step={0.01} value={settings.sharpness} />
      <ShaderSliderControl label="Grain" max={1} min={0} onChange={(value) => update("grain", value)} step={0.01} value={settings.grain} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
