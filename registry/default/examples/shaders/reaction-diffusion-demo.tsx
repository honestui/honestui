"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { ReactionDiffusion, type ReactionDiffusionProps } from "honestui/shaders";

type ReactionDiffusionPattern = NonNullable<ReactionDiffusionProps["pattern"]>;
type ReactionDiffusionFade = NonNullable<ReactionDiffusionProps["fade"]>;

interface ReactionDiffusionSettings {
  pattern: ReactionDiffusionPattern;
  color: string;
  opacity: number;
  fade: ReactionDiffusionFade;
  scale: number;
  speed: number;
  interactive: boolean;
  paused: boolean;
}

const defaults: ReactionDiffusionSettings = {
  pattern: "coral",
  color: "currentColor",
  opacity: 0.35,
  fade: "radial",
  scale: 2,
  speed: 1,
  interactive: true,
  paused: false,
};

// Color control takes hex only, so the theme color is offered as a choice.
const colors = [
  { label: "Theme text", value: "currentColor" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Coral", value: "#f0715a" },
];

const fades: { label: string; value: ReactionDiffusionFade }[] = [
  { label: "None", value: "none" },
  { label: "Radial", value: "radial" },
  { label: "Edges", value: "edges" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
];

const patterns: { label: string; value: ReactionDiffusionPattern }[] = [
  { label: "Coral", value: "coral" },
  { label: "Spots", value: "spots" },
  { label: "Maze", value: "maze" },
  { label: "Drift", value: "drift" },
];

export default function ReactionDiffusionDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "ReactionDiffusion",
    props: Object.entries(settings) as [keyof ReactionDiffusionSettings, ReactionDiffusionSettings[keyof ReactionDiffusionSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <ReactionDiffusion className="absolute inset-0" {...settings} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="bg-background/85 text-foreground rounded-full px-5 py-2 text-2xl font-medium tracking-tight shadow-sm backdrop-blur-sm">Grown, not drawn.</p>
          </div>
        </div>
      }
      title="Reaction Diffusion"
    >
      <ShaderSelectControl
        label="Pattern"
        onChange={(value) => update("pattern", value as ReactionDiffusionPattern)}
        options={patterns}
        value={settings.pattern}
      />
      <ShaderSelectControl label="Color" onChange={(value) => update("color", value)} options={colors} value={settings.color} />
      <ShaderSelectControl
        label="Fade"
        onChange={(value) => update("fade", value as ReactionDiffusionFade)}
        options={fades}
        value={settings.fade}
      />
      <ShaderSliderControl label="Opacity" max={1} min={0.1} onChange={(value) => update("opacity", value)} step={0.05} value={settings.opacity} />
      <ShaderSliderControl label="Scale" max={6} min={1} onChange={(value) => update("scale", value)} step={0.5} value={settings.scale} />
      <ShaderSliderControl label="Speed" max={4} min={0} onChange={(value) => update("speed", value)} step={0.1} value={settings.speed} />
      <ShaderSwitchControl checked={settings.interactive} label="Paint with pointer" onChange={(value) => update("interactive", value)} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
