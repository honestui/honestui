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
import { DotGrid, type DotGridFade, type DotGridShape } from "honestui/shaders";

interface DotGridSettings {
  gap: number;
  dotSize: number;
  shape: DotGridShape;
  color: string;
  opacity: number;
  wave: number;
  twinkle: number;
  speed: number;
  interactive: boolean;
  highlightColor: string;
  highlightRadius: number;
  highlightScale: number;
  fade: DotGridFade;
}

const defaults: DotGridSettings = {
  gap: 20,
  dotSize: 2,
  shape: "circle",
  color: "currentColor",
  opacity: 0.35,
  wave: 0.4,
  twinkle: 0,
  speed: 1,
  interactive: true,
  highlightColor: "#3b82f6",
  highlightRadius: 140,
  highlightScale: 2.2,
  fade: "radial",
};

export default function DotGridDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "DotGrid",
    props: Object.entries(settings) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <DotGrid className="absolute inset-0" {...settings} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="text-foreground text-2xl font-medium tracking-tight">Ship it calmly.</p>
          </div>
        </div>
      }
      title="Dot Grid"
    >
      <ShaderSelectControl
        label="Shape"
        onChange={(value) => update("shape", value as DotGridShape)}
        options={[
          { label: "Circle", value: "circle" },
          { label: "Square", value: "square" },
          { label: "Diamond", value: "diamond" },
          { label: "Cross", value: "cross" },
        ]}
        value={settings.shape}
      />
      <ShaderSelectControl
        label="Fade"
        onChange={(value) => update("fade", value as DotGridFade)}
        options={[
          { label: "None", value: "none" },
          { label: "Radial", value: "radial" },
          { label: "Edges", value: "edges" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ]}
        value={settings.fade}
      />
      <ShaderSliderControl label="Gap" max={64} min={6} onChange={(value) => update("gap", value)} step={1} value={settings.gap} />
      <ShaderSliderControl label="Dot size" max={12} min={0.5} onChange={(value) => update("dotSize", value)} step={0.5} value={settings.dotSize} />
      <ShaderSliderControl label="Opacity" max={1} min={0.05} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Wave" max={1} min={0} onChange={(value) => update("wave", value)} step={0.05} value={settings.wave} />
      <ShaderSliderControl label="Twinkle" max={1} min={0} onChange={(value) => update("twinkle", value)} step={0.05} value={settings.twinkle} />
      <ShaderSliderControl label="Speed" max={3} min={0.1} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
      <ShaderColorControl label="Highlight color" onChange={(value) => update("highlightColor", value)} value={settings.highlightColor} />
      <ShaderSliderControl label="Highlight radius" max={320} min={40} onChange={(value) => update("highlightRadius", value)} step={10} value={settings.highlightRadius} />
      <ShaderSliderControl label="Highlight scale" max={4} min={1} onChange={(value) => update("highlightScale", value)} step={0.1} value={settings.highlightScale} />
      <ShaderSwitchControl checked={settings.interactive} label="Pointer highlight" onChange={(value) => update("interactive", value)} />
    </ShaderPlayground>
  );
}
