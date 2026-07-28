"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { SideRays, type SideRaysOrigin } from "honestui/shaders";

interface SideRaysSettings {
  speed: number;
  rayColor1: string;
  rayColor2: string;
  intensity: number;
  spread: number;
  origin: SideRaysOrigin;
  tilt: number;
  saturation: number;
  blend: number;
  falloff: number;
  opacity: number;
}

const defaults: SideRaysSettings = {
  speed: 2.5,
  rayColor1: "#ffbf69",
  rayColor2: "#7fb3ff",
  intensity: 1.7,
  spread: 1.65,
  origin: "top-right",
  tilt: 0,
  saturation: 1.2,
  blend: 0.68,
  falloff: 1.6,
  opacity: 1,
};

const origins: readonly SideRaysOrigin[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

export default function SideRaysDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "SideRays",
    props: Object.entries(settings) as [keyof SideRaysSettings, SideRaysSettings[keyof SideRaysSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#090b10]">
          <SideRays className="size-full" {...settings} />
        </div>
      }
      title="Side Rays"
    >
      <ShaderColorControl label="Ray color 1" onChange={(value) => update("rayColor1", value)} value={settings.rayColor1} />
      <ShaderColorControl label="Ray color 2" onChange={(value) => update("rayColor2", value)} value={settings.rayColor2} />
      <ShaderSelectControl
        label="Origin"
        onChange={(value) => update("origin", value as SideRaysOrigin)}
        options={origins.map((value) => ({ label: value.replaceAll("-", " "), value }))}
        value={settings.origin}
      />
      <ShaderSliderControl label="Speed" max={5} min={0} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
      <ShaderSliderControl label="Intensity" max={4} min={0} onChange={(value) => update("intensity", value)} step={0.1} value={settings.intensity} />
      <ShaderSliderControl label="Spread" max={3} min={0.1} onChange={(value) => update("spread", value)} step={0.05} value={settings.spread} />
      <ShaderSliderControl label="Tilt" max={90} min={-90} onChange={(value) => update("tilt", value)} step={1} value={settings.tilt} />
      <ShaderSliderControl label="Saturation" max={3} min={0} onChange={(value) => update("saturation", value)} step={0.1} value={settings.saturation} />
      <ShaderSliderControl label="Blend" max={1} min={0} onChange={(value) => update("blend", value)} step={0.01} value={settings.blend} />
      <ShaderSliderControl label="Falloff" max={4} min={0.1} onChange={(value) => update("falloff", value)} step={0.1} value={settings.falloff} />
      <ShaderSliderControl label="Opacity" max={1} min={0} onChange={(value) => update("opacity", value)} step={0.01} value={settings.opacity} />
    </ShaderPlayground>
  );
}
