"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { LightRays, type RaysOrigin } from "honestui/shaders";

interface LightRaysSettings {
  raysOrigin: RaysOrigin;
  raysColor: string;
  raysSpeed: number;
  lightSpread: number;
  rayLength: number;
  pulsating: boolean;
  fadeDistance: number;
  saturation: number;
  followMouse: boolean;
  mouseInfluence: number;
  noiseAmount: number;
  distortion: number;
}

const defaults: LightRaysSettings = {
  raysOrigin: "top-center",
  raysColor: "#b8d6ff",
  raysSpeed: 0.7,
  lightSpread: 0.72,
  rayLength: 2.2,
  pulsating: false,
  fadeDistance: 1,
  saturation: 1,
  followMouse: false,
  mouseInfluence: 0.1,
  noiseAmount: 0.06,
  distortion: 0.08,
};

const rayOrigins: readonly RaysOrigin[] = [
  "top-center",
  "top-left",
  "top-right",
  "right",
  "left",
  "bottom-center",
  "bottom-right",
  "bottom-left",
];

export default function LightRaysDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "LightRays",
    props: Object.entries(settings) as [keyof LightRaysSettings, LightRaysSettings[keyof LightRaysSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#07090d]">
          <LightRays className="size-full" {...settings} />
        </div>
      }
      title="Light Rays"
    >
      <ShaderColorControl label="Ray color" onChange={(value) => update("raysColor", value)} value={settings.raysColor} />
      <ShaderSelectControl
        label="Ray origin"
        onChange={(value) => update("raysOrigin", value as RaysOrigin)}
        options={rayOrigins.map((value) => ({ label: value.replaceAll("-", " "), value }))}
        value={settings.raysOrigin}
      />
      <ShaderSliderControl label="Ray speed" max={3} min={0} onChange={(value) => update("raysSpeed", value)} step={0.05} value={settings.raysSpeed} />
      <ShaderSliderControl label="Light spread" max={2} min={0.1} onChange={(value) => update("lightSpread", value)} step={0.05} value={settings.lightSpread} />
      <ShaderSliderControl label="Ray length" max={5} min={0.2} onChange={(value) => update("rayLength", value)} step={0.1} value={settings.rayLength} />
      <ShaderSliderControl label="Fade distance" max={3} min={0.1} onChange={(value) => update("fadeDistance", value)} step={0.1} value={settings.fadeDistance} />
      <ShaderSliderControl label="Saturation" max={2} min={0} onChange={(value) => update("saturation", value)} step={0.05} value={settings.saturation} />
      <ShaderSliderControl label="Mouse influence" max={1} min={0} onChange={(value) => update("mouseInfluence", value)} step={0.01} value={settings.mouseInfluence} />
      <ShaderSliderControl label="Noise amount" max={1} min={0} onChange={(value) => update("noiseAmount", value)} step={0.01} value={settings.noiseAmount} />
      <ShaderSliderControl label="Distortion" max={1} min={0} onChange={(value) => update("distortion", value)} step={0.01} value={settings.distortion} />
      <ShaderSwitchControl checked={settings.pulsating} label="Pulsating" onChange={(value) => update("pulsating", value)} />
      <ShaderSwitchControl checked={settings.followMouse} label="Follow mouse" onChange={(value) => update("followMouse", value)} />
    </ShaderPlayground>
  );
}
