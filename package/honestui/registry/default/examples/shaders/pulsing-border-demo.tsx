"use client";

import {
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { PulsingBorder } from "honestui/shaders";

interface PulsingBorderSettings {
  active: boolean;
  colors: string[];
  radius: number;
  thickness: number;
  softness: number;
  intensity: number;
  bloom: number;
  innerGlow: number;
  spots: number;
  spotSize: number;
  pulse: number;
  speed: number;
  smoke: number;
  smokeScale: number;
}

const defaults: PulsingBorderSettings = {
  active: true,
  colors: ["#4f8bff", "#a35bff", "#ff5fb4", "#ffa53d"],
  radius: 16,
  thickness: 1.5,
  softness: 0.35,
  intensity: 1,
  bloom: 22,
  innerGlow: 8,
  spots: 4,
  spotSize: 0.7,
  pulse: 0.35,
  speed: 1,
  smoke: 0.25,
  smokeScale: 1,
};

export function PulsingBorderDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);

  return (
    <ShaderPlayground
      code={buildCode(settings)}
      onReset={reset}
      preview={
        <div className="bg-background flex size-full items-center justify-center p-8 sm:p-12">
          <PulsingBorder className="w-full max-w-md" {...settings}>
            <div
              className="border-border bg-background flex h-28 flex-col justify-between border p-4 text-left"
              style={{ borderRadius: settings.radius }}
            >
              <p className="text-muted-foreground text-sm">Ask anything…</p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Thinking with 3 sources</span>
                <span className="bg-foreground text-background flex size-7 items-center justify-center rounded-full text-xs">
                  ↑
                </span>
              </div>
            </div>
          </PulsingBorder>
        </div>
      }
      title="Pulsing Border"
    >
      <ShaderColorListControl
        label="Colors"
        maxColors={8}
        minColors={1}
        onChange={(values) => update("colors", values)}
        values={settings.colors}
      />
      <ShaderSwitchControl checked={settings.active} label="Active" onChange={(value) => update("active", value)} />
      <ShaderSliderControl label="Radius" max={40} min={0} onChange={(value) => update("radius", value)} step={1} value={settings.radius} />
      <ShaderSliderControl label="Thickness" max={6} min={0.5} onChange={(value) => update("thickness", value)} step={0.25} value={settings.thickness} />
      <ShaderSliderControl label="Softness" max={1} min={0} onChange={(value) => update("softness", value)} step={0.05} value={settings.softness} />
      <ShaderSliderControl label="Intensity" max={2} min={0} onChange={(value) => update("intensity", value)} step={0.05} value={settings.intensity} />
      <ShaderSliderControl label="Bloom" max={60} min={0} onChange={(value) => update("bloom", value)} step={1} value={settings.bloom} />
      <ShaderSliderControl label="Inner glow" max={30} min={0} onChange={(value) => update("innerGlow", value)} step={1} value={settings.innerGlow} />
      <ShaderSliderControl label="Spots" max={8} min={1} onChange={(value) => update("spots", value)} step={1} value={settings.spots} />
      <ShaderSliderControl label="Spot size" max={1.5} min={0.1} onChange={(value) => update("spotSize", value)} step={0.05} value={settings.spotSize} />
      <ShaderSliderControl label="Pulse" max={1} min={0} onChange={(value) => update("pulse", value)} step={0.05} value={settings.pulse} />
      <ShaderSliderControl label="Speed" max={4} min={0} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
      <ShaderSliderControl label="Smoke" max={1} min={0} onChange={(value) => update("smoke", value)} step={0.05} value={settings.smoke} />
      <ShaderSliderControl label="Smoke scale" max={3} min={0.25} onChange={(value) => update("smokeScale", value)} step={0.05} value={settings.smokeScale} />
    </ShaderPlayground>
  );
}

function formatValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) return `{[${value.map((item) => `"${item}"`).join(", ")}]}`;
  if (typeof value === "string") return `"${value}"`;
  return `{${typeof value === "number" ? Number(value.toFixed(3)) : value}}`;
}

function buildCode(settings: PulsingBorderSettings) {
  const props = Object.entries(settings)
    .map(([name, value]) => `      ${name}=${formatValue(value)}`)
    .join("\n");

  return `import { PulsingBorder } from "honestui/shaders"

export function Demo() {
  return (
    <PulsingBorder
      className="w-full max-w-md"
${props}
    >
      <div
        className="border bg-background p-4"
        style={{ borderRadius: ${settings.radius} }}
      >
        Ask anything…
      </div>
    </PulsingBorder>
  )
}`;
}

export default PulsingBorderDemo;
