"use client";

import {
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { ShimmerText } from "honestui/shaders";

interface ShimmerTextSettings {
  dim: number;
  width: number;
  duration: number;
  delay: number;
  angle: number;
  active: boolean;
}

const defaults: ShimmerTextSettings = {
  dim: 0.5,
  width: 64,
  duration: 1800,
  delay: 700,
  angle: 105,
  active: true,
};

// Split so the shader index does not read the sample as this file's export.
const SAMPLE_EXPORT = ["export", "function Demo()"].join(" ");

function buildCode(settings: ShimmerTextSettings) {
  const props = [
    `dim={${settings.dim}}`,
    `width={${settings.width}}`,
    `duration={${settings.duration}}`,
    `delay={${settings.delay}}`,
    `angle={${settings.angle}}`,
    `active={${settings.active}}`,
  ].join(" ");
  return `import { ShimmerText } from "honestui/shaders"

${SAMPLE_EXPORT} {
  return (
    <div className="grid gap-4 text-center">
      <h2 className="text-5xl font-semibold tracking-tight">
        <ShimmerText ${props}>
          Ideas, made real.
        </ShimmerText>
      </h2>
      <p role="status" className="text-sm text-muted-foreground">
        <ShimmerText active={${settings.active}}>Thinking…</ShimmerText>
      </p>
    </div>
  )
}`;
}

export default function ShimmerTextDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);

  return (
    <ShaderPlayground
      code={buildCode(settings)}
      onReset={reset}
      preview={
        <div className="grid size-full place-items-center bg-background px-6 text-foreground">
          <div className="grid gap-4 text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <ShimmerText {...settings}>Ideas, made real.</ShimmerText>
            </h2>
            <p role="status" className="text-sm text-muted-foreground">
              <ShimmerText active={settings.active}>
                {settings.active ? "Thinking…" : "Done thinking"}
              </ShimmerText>
            </p>
          </div>
        </div>
      }
      title="Shimmer Text"
    >
      <ShaderSliderControl label="Dim" max={0.9} min={0} onChange={(value) => update("dim", value)} step={0.05} value={settings.dim} />
      <ShaderSliderControl label="Band width" max={240} min={16} onChange={(value) => update("width", value)} step={4} value={settings.width} formatValue={(value) => `${value}px`} />
      <ShaderSliderControl label="Duration" max={5000} min={400} onChange={(value) => update("duration", value)} step={100} value={settings.duration} formatValue={(value) => `${value} ms`} />
      <ShaderSliderControl label="Delay" max={4000} min={0} onChange={(value) => update("delay", value)} step={100} value={settings.delay} formatValue={(value) => `${value} ms`} />
      <ShaderSliderControl label="Angle" max={150} min={30} onChange={(value) => update("angle", value)} step={1} value={settings.angle} formatValue={(value) => `${value}°`} />
      <ShaderSwitchControl checked={settings.active} label="Active" onChange={(value) => update("active", value)} />
    </ShaderPlayground>
  );
}
