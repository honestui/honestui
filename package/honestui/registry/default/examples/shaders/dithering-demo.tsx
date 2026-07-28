"use client";

import {
  buildShaderCode,
  hexToNormalizedRgb,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Dither } from "honestui/shaders";

interface DitherSettings {
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveColor: string;
  colorNum: number;
  pixelSize: number;
  disableAnimation: boolean;
  enableMouseInteraction: boolean;
  mouseRadius: number;
}

const defaults: DitherSettings = {
  waveSpeed: 0.04,
  waveFrequency: 2.4,
  waveAmplitude: 0.36,
  waveColor: "#387af2",
  colorNum: 5,
  pixelSize: 3,
  disableAnimation: false,
  enableMouseInteraction: true,
  mouseRadius: 0.8,
};

export default function DitheringDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const waveColor = hexToNormalizedRgb(settings.waveColor);
  const code = buildShaderCode({
    componentName: "Dither",
    supportsClassName: false,
    props: [
      ["waveSpeed", settings.waveSpeed],
      ["waveFrequency", settings.waveFrequency],
      ["waveAmplitude", settings.waveAmplitude],
      ["waveColor", waveColor],
      ["colorNum", settings.colorNum],
      ["pixelSize", settings.pixelSize],
      ["disableAnimation", settings.disableAnimation],
      ["enableMouseInteraction", settings.enableMouseInteraction],
      ["mouseRadius", settings.mouseRadius],
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#080b12]">
          <Dither {...settings} waveColor={waveColor} />
        </div>
      }
      title="Dithering"
    >
      <ShaderColorControl label="Wave color" onChange={(value) => update("waveColor", value)} value={settings.waveColor} />
      <ShaderSliderControl label="Wave speed" max={0.2} min={0} onChange={(value) => update("waveSpeed", value)} step={0.01} value={settings.waveSpeed} />
      <ShaderSliderControl label="Wave frequency" max={8} min={0.5} onChange={(value) => update("waveFrequency", value)} step={0.1} value={settings.waveFrequency} />
      <ShaderSliderControl label="Wave amplitude" max={1} min={0.05} onChange={(value) => update("waveAmplitude", value)} step={0.01} value={settings.waveAmplitude} />
      <ShaderSliderControl label="Color levels" max={16} min={2} onChange={(value) => update("colorNum", value)} step={1} value={settings.colorNum} />
      <ShaderSliderControl label="Pixel size" max={10} min={1} onChange={(value) => update("pixelSize", value)} step={1} value={settings.pixelSize} />
      <ShaderSliderControl label="Mouse radius" max={3} min={0.1} onChange={(value) => update("mouseRadius", value)} step={0.1} value={settings.mouseRadius} />
      <ShaderSwitchControl checked={settings.disableAnimation} label="Disable animation" onChange={(value) => update("disableAnimation", value)} />
      <ShaderSwitchControl checked={settings.enableMouseInteraction} label="Mouse interaction" onChange={(value) => update("enableMouseInteraction", value)} />
    </ShaderPlayground>
  );
}
