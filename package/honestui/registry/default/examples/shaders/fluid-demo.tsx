"use client";

import {
  buildShaderCode,
  ShaderColorControl,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { Fluid } from "honestui/shaders";

interface FluidSettings {
  colors: string[];
  colorIntensity: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressure: number;
  pressureIterations: number;
  curl: number;
  splatRadius: number;
  splatForce: number;
  simResolution: number;
  dyeResolution: number;
  shading: boolean;
  autoSplats: boolean;
  backgroundColor: string;
}

const defaults: FluidSettings = {
  colors: ["#4f8bff", "#a35bff", "#ff5fb4", "#2dd4bf"],
  colorIntensity: 0.15,
  densityDissipation: 1,
  velocityDissipation: 0.2,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 28,
  splatRadius: 0.22,
  splatForce: 6000,
  simResolution: 128,
  dyeResolution: 1024,
  shading: true,
  autoSplats: true,
  backgroundColor: "#0b0d12",
};

export default function FluidDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const code = buildShaderCode({
    componentName: "Fluid",
    props: Object.entries(settings) as [keyof FluidSettings, FluidSettings[keyof FluidSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      preview={
        <div className="relative size-full cursor-crosshair" style={{ background: settings.backgroundColor }}>
          <Fluid className="size-full" {...settings} />
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white/60">
            Move the pointer or tap to stir
          </p>
        </div>
      }
      title="Fluid"
    >
      <ShaderColorListControl
        label="Colors"
        maxColors={8}
        minColors={0}
        onChange={(values) => update("colors", values)}
        values={settings.colors}
      />
      <ShaderColorControl label="Background" onChange={(value) => update("backgroundColor", value)} value={settings.backgroundColor} />
      <ShaderSliderControl label="Color intensity" max={0.6} min={0.02} onChange={(value) => update("colorIntensity", value)} step={0.01} value={settings.colorIntensity} />
      <ShaderSliderControl label="Dye dissipation" max={4} min={0} onChange={(value) => update("densityDissipation", value)} step={0.05} value={settings.densityDissipation} />
      <ShaderSliderControl label="Velocity dissipation" max={4} min={0} onChange={(value) => update("velocityDissipation", value)} step={0.05} value={settings.velocityDissipation} />
      <ShaderSliderControl label="Pressure" max={1} min={0} onChange={(value) => update("pressure", value)} step={0.05} value={settings.pressure} />
      <ShaderSliderControl label="Pressure iterations" max={50} min={1} onChange={(value) => update("pressureIterations", value)} step={1} value={settings.pressureIterations} />
      <ShaderSliderControl label="Curl" max={60} min={0} onChange={(value) => update("curl", value)} step={1} value={settings.curl} />
      <ShaderSliderControl label="Splat radius" max={1} min={0.02} onChange={(value) => update("splatRadius", value)} step={0.01} value={settings.splatRadius} />
      <ShaderSliderControl label="Splat force" max={15000} min={500} onChange={(value) => update("splatForce", value)} step={100} value={settings.splatForce} />
      <ShaderSliderControl label="Simulation resolution" max={256} min={32} onChange={(value) => update("simResolution", value)} step={16} value={settings.simResolution} />
      <ShaderSliderControl label="Dye resolution" max={2048} min={256} onChange={(value) => update("dyeResolution", value)} step={64} value={settings.dyeResolution} />
      <ShaderSwitchControl checked={settings.shading} label="Shading" onChange={(value) => update("shading", value)} />
      <ShaderSwitchControl checked={settings.autoSplats} label="Idle motion" onChange={(value) => update("autoSplats", value)} />
    </ShaderPlayground>
  );
}
