"use client";

import {
  buildShaderCode,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { GradientBlinds } from "honestui/shaders";

interface BlindsSettings {
  dpr: number;
  paused: boolean;
  gradientColors: string[];
  angle: number;
  noise: number;
  blindCount: number;
  blindMinWidth: number;
  mouseDampening: number;
  mirrorGradient: boolean;
  spotlightRadius: number;
  spotlightSoftness: number;
  spotlightOpacity: number;
  distortAmount: number;
  shineDirection: "left" | "right";
  mixBlendMode: string;
}

const defaults: BlindsSettings = {
  dpr: 1.5,
  paused: false,
  gradientColors: ["#ffb86b", "#f9f4e8", "#4f7cff"],
  angle: 18,
  noise: 0.12,
  blindCount: 12,
  blindMinWidth: 60,
  mouseDampening: 0.15,
  mirrorGradient: false,
  spotlightRadius: 0.5,
  spotlightSoftness: 1,
  spotlightOpacity: 0.72,
  distortAmount: 0.18,
  shineDirection: "left",
  mixBlendMode: "normal",
};

const blendModes = [
  "normal",
  "lighten",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "difference",
] as const;

export default function BlindsDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "GradientBlinds",
    props: [
      ["dpr", settings.dpr],
      ["paused", settings.paused],
      ["gradientColors", settings.gradientColors],
      ["angle", settings.angle],
      ["noise", settings.noise],
      ["blindCount", settings.blindCount],
      ["blindMinWidth", settings.blindMinWidth],
      ["mouseDampening", settings.mouseDampening],
      ["mirrorGradient", settings.mirrorGradient],
      ["spotlightRadius", settings.spotlightRadius],
      ["spotlightSoftness", settings.spotlightSoftness],
      ["spotlightOpacity", settings.spotlightOpacity],
      ["distortAmount", settings.distortAmount],
      ["shineDirection", settings.shineDirection],
      ["mixBlendMode", settings.mixBlendMode],
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#090b10]">
          <GradientBlinds className="size-full" {...settings} />
        </div>
      }
      title="Gradient Blinds"
    >
      <ShaderColorListControl
        label="Gradient colors"
        onChange={(value) => update("gradientColors", value)}
        values={settings.gradientColors}
      />
      <ShaderSliderControl label="DPR" max={2} min={0.5} onChange={(value) => update("dpr", value)} step={0.25} value={settings.dpr} />
      <ShaderSliderControl label="Angle" max={180} min={-180} onChange={(value) => update("angle", value)} step={1} value={settings.angle} />
      <ShaderSliderControl label="Noise" max={1} min={0} onChange={(value) => update("noise", value)} step={0.01} value={settings.noise} />
      <ShaderSliderControl label="Blind count" max={32} min={2} onChange={(value) => update("blindCount", value)} step={1} value={settings.blindCount} />
      <ShaderSliderControl label="Minimum blind width" max={160} min={10} onChange={(value) => update("blindMinWidth", value)} step={5} value={settings.blindMinWidth} />
      <ShaderSliderControl label="Mouse dampening" max={1} min={0.01} onChange={(value) => update("mouseDampening", value)} step={0.01} value={settings.mouseDampening} />
      <ShaderSliderControl label="Spotlight radius" max={1.5} min={0.05} onChange={(value) => update("spotlightRadius", value)} step={0.05} value={settings.spotlightRadius} />
      <ShaderSliderControl label="Spotlight softness" max={2} min={0} onChange={(value) => update("spotlightSoftness", value)} step={0.05} value={settings.spotlightSoftness} />
      <ShaderSliderControl label="Spotlight opacity" max={1} min={0} onChange={(value) => update("spotlightOpacity", value)} step={0.01} value={settings.spotlightOpacity} />
      <ShaderSliderControl label="Distortion" max={1} min={0} onChange={(value) => update("distortAmount", value)} step={0.01} value={settings.distortAmount} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
      <ShaderSwitchControl checked={settings.mirrorGradient} label="Mirror gradient" onChange={(value) => update("mirrorGradient", value)} />
      <ShaderSelectControl
        label="Shine direction"
        onChange={(value) => update("shineDirection", value as BlindsSettings["shineDirection"])}
        options={[{ label: "Left", value: "left" }, { label: "Right", value: "right" }]}
        value={settings.shineDirection}
      />
      <ShaderSelectControl
        label="Blend mode"
        onChange={(value) => update("mixBlendMode", value)}
        options={blendModes.map((value) => ({ label: value, value }))}
        value={settings.mixBlendMode}
      />
    </ShaderPlayground>
  );
}
