"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Silk } from "honestui/shaders";

interface SilkSettings {
  color: string;
  secondaryColor: string;
  sheenColor: string;
  sheen: number;
  scale: number;
  depth: number;
  softness: number;
  angle: number;
  speed: number;
  paused: boolean;
}

const defaults: SilkSettings = {
  color: "#2b3350",
  secondaryColor: "#3b2f4d",
  sheenColor: "#ffffff",
  sheen: 0.45,
  scale: 1,
  depth: 0.5,
  softness: 0.6,
  angle: -18,
  speed: 1,
  paused: false,
};

export default function SilkDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Silk",
    props: Object.entries(settings) as [keyof SilkSettings, SilkSettings[keyof SilkSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <Silk className="size-full" {...settings}>
          <div className="grid size-full place-items-center p-6 text-center">
            <p className="text-2xl font-medium tracking-tight text-white">Made to be touched.</p>
          </div>
        </Silk>
      }
      title="Silk"
    >
      <ShaderColorControl label="Color" onChange={(value) => update("color", value)} value={settings.color} />
      <ShaderColorControl label="Secondary color" onChange={(value) => update("secondaryColor", value)} value={settings.secondaryColor} />
      <ShaderColorControl label="Sheen color" onChange={(value) => update("sheenColor", value)} value={settings.sheenColor} />
      <ShaderSliderControl label="Sheen" max={1} min={0} onChange={(value) => update("sheen", value)} step={0.01} value={settings.sheen} />
      <ShaderSliderControl label="Scale" max={3} min={0.3} onChange={(value) => update("scale", value)} step={0.05} value={settings.scale} />
      <ShaderSliderControl label="Depth" max={1} min={0} onChange={(value) => update("depth", value)} step={0.01} value={settings.depth} />
      <ShaderSliderControl label="Softness" max={1} min={0} onChange={(value) => update("softness", value)} step={0.01} value={settings.softness} />
      <ShaderSliderControl label="Angle" max={90} min={-90} onChange={(value) => update("angle", value)} step={1} value={settings.angle} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
