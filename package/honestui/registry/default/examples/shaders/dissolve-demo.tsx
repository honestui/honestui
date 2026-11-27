"use client";

import { useState } from "react";
import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Button } from "@/components/ui/button";
import { Dissolve, type DissolveProps } from "honestui/shaders";

type DissolveDirection = NonNullable<DissolveProps["direction"]>;
type DissolveSide = NonNullable<DissolveProps["show"]>;

const images = {
  from: {
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
    label: "lake",
  },
  to: {
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
    label: "city",
  },
} as const;

const directionOptions: { label: string; value: DissolveDirection }[] = [
  { label: "Everywhere", value: "none" },
  { label: "From the left", value: "left" },
  { label: "From the right", value: "right" },
  { label: "From the bottom", value: "up" },
  { label: "From the top", value: "down" },
  { label: "From the center", value: "radial" },
];

interface DissolveSettings {
  duration: number;
  scale: number;
  softness: number;
  edgeColor: string;
  edgeWidth: number;
  direction: DissolveDirection;
}

const defaults: DissolveSettings = {
  duration: 1400,
  scale: 3,
  softness: 0.2,
  edgeColor: "#ffd29a",
  edgeWidth: 0.02,
  direction: "none",
};

export default function DissolveDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const [show, setShow] = useState<DissolveSide>("from");
  // Set while the progress slider is held; the button hands control back to `show`.
  const [scrub, setScrub] = useState<number | null>(null);
  const next = show === "from" ? "to" : "from";

  const code = buildShaderCode({
    componentName: "Dissolve",
    props: [
      ["from", images.from.src],
      ["fromAlt", images.from.alt],
      ["to", images.to.src],
      ["toAlt", images.to.alt],
      ...(scrub === null ? ([["show", show]] as const) : ([["progress", scrub]] as const)),
      ...(Object.entries(settings) as [keyof DissolveSettings, DissolveSettings[keyof DissolveSettings]][]),
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={() => {
        reset();
        setScrub(null);
        setShow("from");
      }}
      preview={
        <div className="relative size-full bg-neutral-900">
          <Dissolve
            className="size-full"
            from={images.from.src}
            fromAlt={images.from.alt}
            to={images.to.src}
            toAlt={images.to.alt}
            show={show}
            progress={scrub ?? undefined}
            {...settings}
          />
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setScrub(null);
                setShow(next);
              }}
            >
              Show the {images[next].label}
            </Button>
          </div>
        </div>
      }
      title="Dissolve"
    >
      <ShaderSliderControl
        label="Progress"
        max={1}
        min={0}
        onChange={(value) => setScrub(value)}
        step={0.01}
        value={scrub ?? (show === "to" ? 1 : 0)}
      />
      <ShaderSelectControl
        label="Direction"
        onChange={(value) => update("direction", value as DissolveDirection)}
        options={directionOptions}
        value={settings.direction}
      />
      <ShaderSliderControl label="Duration" max={4000} min={200} onChange={(value) => update("duration", value)} step={100} value={settings.duration} formatValue={(value) => `${value} ms`} />
      <ShaderSliderControl label="Scale" max={8} min={0.5} onChange={(value) => update("scale", value)} step={0.1} value={settings.scale} />
      <ShaderSliderControl label="Softness" max={1} min={0} onChange={(value) => update("softness", value)} step={0.01} value={settings.softness} />
      <ShaderSliderControl label="Edge width" max={0.2} min={0} onChange={(value) => update("edgeWidth", value)} step={0.005} value={settings.edgeWidth} />
      <ShaderColorControl label="Edge color" onChange={(value) => update("edgeColor", value)} value={settings.edgeColor} />
    </ShaderPlayground>
  );
}
