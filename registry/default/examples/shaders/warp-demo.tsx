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
import { Warp, type WarpPattern } from "honestui/shaders";

interface WarpSettings {
  colors: string[];
  pattern: WarpPattern;
  scale: number;
  octaves: number;
  warp: number;
  swirl: number;
  contrast: number;
  speed: number;
  paused: boolean;
}

const defaults: WarpSettings = {
  colors: ["#14161f", "#2c3552", "#6f7fa8", "#d9c8b4", "#f6efe6"],
  pattern: "fbm",
  scale: 1,
  octaves: 5,
  warp: 1,
  swirl: 0.3,
  contrast: 1.2,
  speed: 0.4,
  paused: false,
};

const patterns: { label: string; value: WarpPattern }[] = [
  { label: "fbm", value: "fbm" },
  { label: "Ridged", value: "ridged" },
  { label: "Marble", value: "marble" },
];

export default function WarpDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Warp",
    props: Object.entries(settings) as [keyof WarpSettings, WarpSettings[keyof WarpSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full bg-[#2c3552]">
          <Warp className="size-full" {...settings} />
        </div>
      }
      title="Warp"
    >
      <ShaderColorListControl
        label="Colors"
        maxColors={6}
        minColors={2}
        onChange={(value) => update("colors", value)}
        values={settings.colors}
      />
      <ShaderSelectControl
        label="Pattern"
        onChange={(value) => update("pattern", value as WarpPattern)}
        options={patterns}
        value={settings.pattern}
      />
      <ShaderSliderControl label="Scale" max={4} min={0.2} onChange={(value) => update("scale", value)} step={0.05} value={settings.scale} />
      <ShaderSliderControl label="Octaves" max={8} min={1} onChange={(value) => update("octaves", value)} step={1} value={settings.octaves} />
      <ShaderSliderControl label="Warp" max={2} min={0} onChange={(value) => update("warp", value)} step={0.01} value={settings.warp} />
      <ShaderSliderControl label="Swirl" max={1} min={0} onChange={(value) => update("swirl", value)} step={0.01} value={settings.swirl} />
      <ShaderSliderControl label="Contrast" max={3} min={0.5} onChange={(value) => update("contrast", value)} step={0.05} value={settings.contrast} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
