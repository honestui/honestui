"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderTextControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { GridDistortion } from "honestui/shaders";

interface GridDistortionSettings {
  grid: number;
  mouse: number;
  strength: number;
  relaxation: number;
  imageSrc: string;
}

const defaults: GridDistortionSettings = {
  grid: 18,
  mouse: 0.18,
  strength: 0.22,
  relaxation: 0.92,
  imageSrc: "/ohio-stadium.jpg",
};

export default function GridDistortionDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "GridDistortion",
    props: [
      ["imageSrc", settings.imageSrc],
      ["grid", settings.grid],
      ["mouse", settings.mouse],
      ["strength", settings.strength],
      ["relaxation", settings.relaxation],
    ],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="size-full overflow-hidden bg-[#15191f]">
          <GridDistortion className="size-full" {...settings} />
        </div>
      }
      title="Grid Distortion"
    >
      <ShaderTextControl className="col-span-2" label="Image source" onChange={(value) => update("imageSrc", value)} value={settings.imageSrc} />
      <ShaderSliderControl label="Grid resolution" max={40} min={4} onChange={(value) => update("grid", value)} step={1} value={settings.grid} />
      <ShaderSliderControl label="Mouse radius" max={0.5} min={0.01} onChange={(value) => update("mouse", value)} step={0.01} value={settings.mouse} />
      <ShaderSliderControl label="Strength" max={1} min={0} onChange={(value) => update("strength", value)} step={0.01} value={settings.strength} />
      <ShaderSliderControl label="Relaxation" max={0.99} min={0.5} onChange={(value) => update("relaxation", value)} step={0.01} value={settings.relaxation} />
    </ShaderPlayground>
  );
}
