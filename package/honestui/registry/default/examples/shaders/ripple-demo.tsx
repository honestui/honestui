"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Ripple, type RippleProps } from "honestui/shaders";

type RippleTrigger = NonNullable<RippleProps["trigger"]>;

const sources = [
  { label: "Surface", value: "surface", src: undefined, alt: undefined },
  {
    label: "Alpine dusk",
    value: "alpine",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
  },
  {
    label: "Color-blocked city",
    value: "city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
  },
] as const;

const triggers: { label: string; value: RippleTrigger }[] = [
  { label: "Pointer movement", value: "pointer" },
  { label: "Click or tap", value: "click" },
];

interface RippleSettings {
  source: string;
  trigger: RippleTrigger;
  strength: number;
  wavelength: number;
  rippleSpeed: number;
  decay: number;
  autoplay: number;
  paused: boolean;
}

const defaults: RippleSettings = {
  source: "surface",
  trigger: "pointer",
  strength: 12,
  wavelength: 26,
  rippleSpeed: 220,
  decay: 1.1,
  autoplay: 1600,
  paused: false,
};

export default function RippleDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const { source: sourceValue, ...props } = settings;
  const source = sources.find((item) => item.value === sourceValue) ?? sources[0];
  const code = buildShaderCode({
    componentName: "Ripple",
    props: [
      ...(source.src ? ([["src", source.src], ["alt", source.alt]] as const) : []),
      ...(Object.entries(props) as [string, string | number | boolean][]),
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="bg-background text-foreground relative size-full">
          <Ripple className="absolute inset-0" src={source.src} alt={source.alt} {...props} />
          {source.src ? null : (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="text-muted-foreground text-sm">Move the pointer across the surface</p>
            </div>
          )}
        </div>
      }
      title="Ripple"
    >
      <ShaderSelectControl label="Source" onChange={(value) => update("source", value)} options={sources} value={settings.source} />
      <ShaderSelectControl
        label="Trigger"
        onChange={(value) => update("trigger", value as RippleTrigger)}
        options={triggers}
        value={settings.trigger}
      />
      <ShaderSliderControl label="Strength" max={32} min={0} onChange={(value) => update("strength", value)} step={1} value={settings.strength} />
      <ShaderSliderControl label="Wavelength" max={64} min={8} onChange={(value) => update("wavelength", value)} step={1} value={settings.wavelength} />
      <ShaderSliderControl label="Ripple speed" max={600} min={60} onChange={(value) => update("rippleSpeed", value)} step={10} value={settings.rippleSpeed} />
      <ShaderSliderControl label="Decay" max={4} min={0.2} onChange={(value) => update("decay", value)} step={0.1} value={settings.decay} />
      <ShaderSliderControl label="Autoplay (ms)" max={5000} min={0} onChange={(value) => update("autoplay", value)} step={100} value={settings.autoplay} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
