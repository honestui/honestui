"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { LiquidMetal, type LiquidMetalShape } from "honestui/shaders";

interface LiquidMetalSettings {
  shape: LiquidMetalShape;
  colorTint: string;
  repetition: number;
  softness: number;
  distortion: number;
  dispersion: number;
  angle: number;
  speed: number;
  shapeScale: number;
}

const defaults: LiquidMetalSettings = {
  shape: "circle",
  colorTint: "#f4f5f7",
  repetition: 4,
  softness: 0.25,
  distortion: 1,
  dispersion: 0.35,
  angle: 70,
  speed: 0.6,
  shapeScale: 0.72,
};

const shapeOptions = [
  { label: "None", value: "none" },
  { label: "Circle", value: "circle" },
  { label: "Rounded rectangle", value: "rounded-rect" },
] as const;

export default function LiquidMetalDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "LiquidMetal",
    props: Object.entries(settings) as [keyof LiquidMetalSettings, LiquidMetalSettings[keyof LiquidMetalSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#101114]">
          <LiquidMetal className="size-full" {...settings} />
        </div>
      }
      title="Liquid Metal"
    >
      <ShaderSelectControl
        label="Shape"
        onChange={(value) => update("shape", value as LiquidMetalShape)}
        options={shapeOptions}
        value={settings.shape}
      />
      <ShaderColorControl label="Tint" onChange={(value) => update("colorTint", value)} value={settings.colorTint} />
      <ShaderSliderControl label="Repetition" max={8} min={1} onChange={(value) => update("repetition", value)} step={0.1} value={settings.repetition} />
      <ShaderSliderControl label="Softness" max={1} min={0} onChange={(value) => update("softness", value)} step={0.01} value={settings.softness} />
      <ShaderSliderControl label="Distortion" max={2} min={0} onChange={(value) => update("distortion", value)} step={0.05} value={settings.distortion} />
      <ShaderSliderControl label="Dispersion" max={1} min={0} onChange={(value) => update("dispersion", value)} step={0.01} value={settings.dispersion} />
      <ShaderSliderControl label="Angle" max={180} min={-180} onChange={(value) => update("angle", value)} step={1} value={settings.angle} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSliderControl label="Shape scale" max={1} min={0.2} onChange={(value) => update("shapeScale", value)} step={0.01} value={settings.shapeScale} />
    </ShaderPlayground>
  );
}
