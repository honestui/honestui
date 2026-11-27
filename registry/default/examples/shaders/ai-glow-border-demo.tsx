"use client";

import {
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { ArrowUp, Paperclip } from "honestui/icons";
import { AiGlowBorder, type AiGlowBorderState } from "honestui/shaders";

interface AiGlowBorderSettings {
  state: AiGlowBorderState;
  palette: "spectrum" | "mono";
  intensity: number;
  bloom: number;
  thickness: number;
  speed: number;
}

const defaults: AiGlowBorderSettings = {
  state: "thinking",
  palette: "spectrum",
  intensity: 0.6,
  bloom: 18,
  thickness: 1.25,
  speed: 1,
};

const stateOptions = [
  { label: "Idle", value: "idle" },
  { label: "Thinking", value: "thinking" },
  { label: "Streaming", value: "streaming" },
  { label: "Error", value: "error" },
] as const;

const paletteOptions = [
  { label: "Spectrum", value: "spectrum" },
  { label: "Mono", value: "mono" },
] as const;

const statusText: Record<AiGlowBorderState, string> = {
  idle: "Ready",
  thinking: "Thinking…",
  streaming: "Writing a reply…",
  error: "The reply failed",
};

export function AiGlowBorderDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);

  return (
    <ShaderPlayground
      code={buildCode(settings)}
      onReset={reset}
      preview={
        <div className="bg-background flex size-full items-center justify-center p-8 sm:p-12">
          <AiGlowBorder className="w-full max-w-md" {...settings}>
            <div className="flex flex-col gap-[var(--hui-space-2)] rounded-[20px] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-3)] shadow-[var(--hui-shadow-soft)]">
              <p className="m-0 min-h-10 px-[var(--hui-space-2)] pt-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)]">
                Summarize last week’s support tickets
              </p>
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-[var(--hui-radius-2)] text-[var(--hui-color-foreground-base-secondary)]">
                  <Paperclip aria-hidden className="size-4" />
                </span>
                <span className="flex items-center gap-[var(--hui-space-3)]">
                  <span
                    role="status"
                    className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
                  >
                    {statusText[settings.state]}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-[var(--hui-color-foreground-base-primary)] text-[var(--hui-color-background-base-primary)]">
                    <ArrowUp aria-hidden className="size-4" />
                  </span>
                </span>
              </div>
            </div>
          </AiGlowBorder>
        </div>
      }
      title="AI Glow Border"
    >
      <ShaderSelectControl
        label="State"
        onChange={(value) => update("state", value as AiGlowBorderState)}
        options={stateOptions}
        value={settings.state}
      />
      <ShaderSelectControl
        label="Palette"
        onChange={(value) => update("palette", value as AiGlowBorderSettings["palette"])}
        options={paletteOptions}
        value={settings.palette}
      />
      <ShaderSliderControl label="Intensity" max={1} min={0} onChange={(value) => update("intensity", value)} step={0.05} value={settings.intensity} />
      <ShaderSliderControl label="Bloom" max={48} min={0} onChange={(value) => update("bloom", value)} step={1} value={settings.bloom} />
      <ShaderSliderControl label="Thickness" max={4} min={0.5} onChange={(value) => update("thickness", value)} step={0.25} value={settings.thickness} />
      <ShaderSliderControl label="Speed" max={3} min={0} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
    </ShaderPlayground>
  );
}

function formatValue(value: string | number) {
  return typeof value === "string" ? `"${value}"` : `{${Number(value.toFixed(3))}}`;
}

function buildCode(settings: AiGlowBorderSettings) {
  const props = Object.entries(settings)
    .map(([name, value]) => `      ${name}=${formatValue(value)}`)
    .join("\n");

  return `import { AiGlowBorder } from "honestui/shaders"

export function Demo() {
  return (
    <AiGlowBorder
      className="w-full max-w-md"
${props}
    >
      <form className="rounded-[20px] border bg-background p-3">
        <textarea aria-label="Prompt" />
      </form>
    </AiGlowBorder>
  )
}`;
}

export default AiGlowBorderDemo;
