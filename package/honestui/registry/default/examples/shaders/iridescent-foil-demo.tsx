"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { IridescentFoil } from "honestui/shaders";

interface IridescentFoilSettings {
  intensity: number;
  scale: number;
  hue: number;
  sparkle: number;
  speed: number;
  tilt: number;
  layer: "under" | "over";
  interactive: boolean;
  paused: boolean;
}

const defaults: IridescentFoilSettings = {
  intensity: 0.55,
  scale: 1,
  hue: 0,
  sparkle: 0.35,
  speed: 0.6,
  tilt: 6,
  layer: "under",
  interactive: true,
  paused: false,
};

const layers = [
  { label: "Under content", value: "under" },
  { label: "Over content", value: "over" },
];

export default function IridescentFoilDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "IridescentFoil",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background grid size-full place-items-center p-6">
          <IridescentFoil
            className="border-border bg-card text-card-foreground aspect-[1.586] w-full max-w-sm rounded-2xl border shadow-sm"
            {...settings}
          >
            <div className="flex size-full flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium tracking-tight">Honest Pro</span>
                <span className="text-muted-foreground font-mono text-xs">2026</span>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Member since</p>
                <p className="text-lg font-medium tracking-tight">March 2024</p>
              </div>
            </div>
          </IridescentFoil>
        </div>
      }
      title="Iridescent Foil"
    >
      <ShaderSliderControl label="Intensity" max={1} min={0} onChange={(value) => update("intensity", value)} step={0.01} value={settings.intensity} />
      <ShaderSliderControl label="Scale" max={3} min={0.3} onChange={(value) => update("scale", value)} step={0.05} value={settings.scale} />
      <ShaderSliderControl label="Hue" max={1} min={0} onChange={(value) => update("hue", value)} step={0.01} value={settings.hue} />
      <ShaderSliderControl label="Sparkle" max={1} min={0} onChange={(value) => update("sparkle", value)} step={0.01} value={settings.sparkle} />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSliderControl label="Tilt" max={15} min={0} onChange={(value) => update("tilt", value)} step={0.5} value={settings.tilt} />
      <ShaderSelectControl label="Layer" onChange={(value) => update("layer", value as IridescentFoilSettings["layer"])} options={layers} value={settings.layer} />
      <ShaderSwitchControl checked={settings.interactive} label="Follow pointer" onChange={(value) => update("interactive", value)} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
