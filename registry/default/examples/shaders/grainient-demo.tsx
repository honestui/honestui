"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Grainient } from "honestui/shaders";

interface GrainientSettings {
  timeSpeed: number;
  colorBalance: number;
  warpStrength: number;
  warpFrequency: number;
  warpSpeed: number;
  warpAmplitude: number;
  blendAngle: number;
  blendSoftness: number;
  rotationAmount: number;
  noiseScale: number;
  grainAmount: number;
  grainScale: number;
  grainAnimated: boolean;
  contrast: number;
  gamma: number;
  saturation: number;
  centerX: number;
  centerY: number;
  zoom: number;
  color1: string;
  color2: string;
  color3: string;
}

const defaults: GrainientSettings = {
  timeSpeed: 0.25,
  colorBalance: 0,
  warpStrength: 1,
  warpFrequency: 5,
  warpSpeed: 2,
  warpAmplitude: 50,
  blendAngle: 0,
  blendSoftness: 0.05,
  rotationAmount: 500,
  noiseScale: 2,
  grainAmount: 0.1,
  grainScale: 2,
  grainAnimated: false,
  contrast: 1.5,
  gamma: 1,
  saturation: 1,
  centerX: 0,
  centerY: 0,
  zoom: 0.9,
  color1: "#ff9ffc",
  color2: "#5227ff",
  color3: "#b497cf",
};

export default function GrainientDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Grainient",
    props: Object.entries(settings) as [keyof GrainientSettings, GrainientSettings[keyof GrainientSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#12100e]">
          <Grainient className="size-full" {...settings} />
        </div>
      }
      title="Grainient"
    >
      <ShaderColorControl label="Color 1" onChange={(value) => update("color1", value)} value={settings.color1} />
      <ShaderColorControl label="Color 2" onChange={(value) => update("color2", value)} value={settings.color2} />
      <ShaderColorControl label="Color 3" onChange={(value) => update("color3", value)} value={settings.color3} />
      <ShaderSliderControl label="Time speed" max={1} min={0} onChange={(value) => update("timeSpeed", value)} step={0.01} value={settings.timeSpeed} />
      <ShaderSliderControl label="Color balance" max={1} min={-1} onChange={(value) => update("colorBalance", value)} step={0.05} value={settings.colorBalance} />
      <ShaderSliderControl label="Warp strength" max={2} min={0} onChange={(value) => update("warpStrength", value)} step={0.05} value={settings.warpStrength} />
      <ShaderSliderControl label="Warp frequency" max={10} min={0.5} onChange={(value) => update("warpFrequency", value)} step={0.1} value={settings.warpFrequency} />
      <ShaderSliderControl label="Warp speed" max={5} min={0} onChange={(value) => update("warpSpeed", value)} step={0.1} value={settings.warpSpeed} />
      <ShaderSliderControl label="Warp amplitude" max={100} min={1} onChange={(value) => update("warpAmplitude", value)} step={1} value={settings.warpAmplitude} />
      <ShaderSliderControl label="Blend angle" max={180} min={-180} onChange={(value) => update("blendAngle", value)} step={1} value={settings.blendAngle} />
      <ShaderSliderControl label="Blend softness" max={1} min={0} onChange={(value) => update("blendSoftness", value)} step={0.01} value={settings.blendSoftness} />
      <ShaderSliderControl label="Rotation amount" max={1000} min={0} onChange={(value) => update("rotationAmount", value)} step={10} value={settings.rotationAmount} />
      <ShaderSliderControl label="Noise scale" max={10} min={0.1} onChange={(value) => update("noiseScale", value)} step={0.1} value={settings.noiseScale} />
      <ShaderSliderControl label="Grain amount" max={0.5} min={0} onChange={(value) => update("grainAmount", value)} step={0.01} value={settings.grainAmount} />
      <ShaderSliderControl label="Grain scale" max={10} min={0.1} onChange={(value) => update("grainScale", value)} step={0.1} value={settings.grainScale} />
      <ShaderSwitchControl checked={settings.grainAnimated} label="Grain animated" onChange={(value) => update("grainAnimated", value)} />
      <ShaderSliderControl label="Contrast" max={3} min={0.1} onChange={(value) => update("contrast", value)} step={0.1} value={settings.contrast} />
      <ShaderSliderControl label="Gamma" max={3} min={0.1} onChange={(value) => update("gamma", value)} step={0.1} value={settings.gamma} />
      <ShaderSliderControl label="Saturation" max={2} min={0} onChange={(value) => update("saturation", value)} step={0.1} value={settings.saturation} />
      <ShaderSliderControl label="Center offset X" max={1} min={-1} onChange={(value) => update("centerX", value)} step={0.05} value={settings.centerX} />
      <ShaderSliderControl label="Center offset Y" max={1} min={-1} onChange={(value) => update("centerY", value)} step={0.05} value={settings.centerY} />
      <ShaderSliderControl label="Zoom" max={2} min={0.1} onChange={(value) => update("zoom", value)} step={0.05} value={settings.zoom} />
    </ShaderPlayground>
  );
}
