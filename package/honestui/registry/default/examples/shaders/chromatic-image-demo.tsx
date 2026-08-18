"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { ChromaticImage } from "honestui/shaders";

const exampleImages = [
  {
    label: "Alpine dusk",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    alt: "An alpine lake reflecting an orange sunset between dark mountain ridges.",
  },
  {
    label: "Color-blocked city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    alt: "Blue and orange apartment buildings against a clear sky.",
  },
] as const;

interface ChromaticImageSettings {
  src: string;
  backgroundColor: string;
  zoom: number;
  displacement: number;
  chromaticShift: number;
  tilt: number;
}

const defaults: ChromaticImageSettings = {
  src: exampleImages[0].src,
  backgroundColor: "#111111",
  zoom: 0.2,
  displacement: 0.05,
  chromaticShift: 0.01,
  tilt: 0.3,
};

export default function ChromaticImageDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const image =
    exampleImages.find((example) => example.src === settings.src) ??
    exampleImages[0];
  const code = buildShaderCode({
    componentName: "ChromaticImage",
    props: [
      ["src", image.src],
      ["alt", image.alt],
      ["backgroundColor", settings.backgroundColor],
      ["zoom", settings.zoom],
      ["displacement", settings.displacement],
      ["chromaticShift", settings.chromaticShift],
      ["tilt", settings.tilt],
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <ChromaticImage
          alt={image.alt}
          backgroundColor={settings.backgroundColor}
          chromaticShift={settings.chromaticShift}
          className="size-full"
          displacement={settings.displacement}
          src={image.src}
          tilt={settings.tilt}
          zoom={settings.zoom}
        />
      }
      title="Chromatic Image"
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Example image"
        onChange={(value) => update("src", value)}
        options={exampleImages.map(({ label, src }) => ({ label, value: src }))}
        value={settings.src}
      />
      <ShaderColorControl
        label="Background color"
        onChange={(value) => update("backgroundColor", value)}
        value={settings.backgroundColor}
      />
      <ShaderSliderControl
        label="Zoom"
        max={1}
        min={0}
        onChange={(value) => update("zoom", value)}
        step={0.01}
        value={settings.zoom}
      />
      <ShaderSliderControl
        label="Displacement"
        max={0.2}
        min={0}
        onChange={(value) => update("displacement", value)}
        step={0.005}
        value={settings.displacement}
      />
      <ShaderSliderControl
        label="Chromatic shift"
        max={0.05}
        min={0}
        onChange={(value) => update("chromaticShift", value)}
        step={0.001}
        value={settings.chromaticShift}
      />
      <ShaderSliderControl
        label="Tilt"
        max={1}
        min={0}
        onChange={(value) => update("tilt", value)}
        step={0.05}
        value={settings.tilt}
      />
    </ShaderPlayground>
  );
}
