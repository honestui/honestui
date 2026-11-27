"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Metaballs } from "honestui/shaders";

interface MetaballsSettings {
  colors: string[];
  backgroundColor: string;
  count: number;
  size: number;
  spread: number;
  softness: number;
  speed: number;
  followPointer: boolean;
}

const defaults: MetaballsSettings = {
  colors: ["#6366f1", "#a855f7", "#ec4899", "#38bdf8"],
  backgroundColor: "#0c0d12",
  count: 9,
  size: 1,
  spread: 0.8,
  softness: 0,
  speed: 1,
  followPointer: true,
};

export default function MetaballsDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Metaballs",
    props: Object.entries(settings) as [keyof MetaballsSettings, MetaballsSettings[keyof MetaballsSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={<Metaballs className="size-full" {...settings} />}
      title="Metaballs"
    >
      <div className="col-span-2">
        <ShaderColorListControl
          label="Colors"
          maxColors={8}
          minColors={1}
          onChange={(value) => update("colors", value)}
          values={settings.colors}
        />
      </div>
      <ShaderColorControl label="Background" onChange={(value) => update("backgroundColor", value)} value={settings.backgroundColor} />
      <ShaderSwitchControl checked={settings.followPointer} label="Follow pointer" onChange={(value) => update("followPointer", value)} />
      <ShaderSliderControl label="Count" max={20} min={1} onChange={(value) => update("count", value)} step={1} value={settings.count} />
      <ShaderSliderControl label="Size" max={2} min={0.3} onChange={(value) => update("size", value)} step={0.05} value={settings.size} />
      <ShaderSliderControl label="Spread" max={1} min={0} onChange={(value) => update("spread", value)} step={0.01} value={settings.spread} />
      <ShaderSliderControl label="Softness" max={1} min={0} onChange={(value) => update("softness", value)} step={0.01} value={settings.softness} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
    </ShaderPlayground>
  );
}
