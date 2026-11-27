"use client";

import {
  buildShaderCode,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { LiquidGlass, MeshGradient } from "honestui/shaders";

const backdrops = [
  {
    label: "Color-blocked city",
    value: "city",
    src: "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85",
    tone: "light",
  },
  {
    label: "Alpine dusk",
    value: "alpine",
    src: "https://images.unsplash.com/photo-1776348568867-24146d18b736?auto=format&fit=crop&w=1600&q=85",
    tone: "dark",
  },
  { label: "Mesh gradient with type", value: "mesh", src: undefined, tone: "dark" },
] as const;

interface LiquidGlassSettings {
  backdrop: string;
  radius: number;
  bezel: number;
  refraction: number;
  dispersion: number;
  frost: number;
  saturation: number;
  specular: number;
  lightAngle: number;
  interactive: boolean;
}

const defaults: LiquidGlassSettings = {
  backdrop: "city",
  radius: 32,
  bezel: 24,
  refraction: 0.65,
  dispersion: 0.25,
  frost: 0.08,
  saturation: 1.5,
  specular: 0.7,
  lightAngle: 315,
  interactive: true,
};

function Backdrop({ value }: { value: string }) {
  const backdrop = backdrops.find((item) => item.value === value) ?? backdrops[0];
  if (backdrop.src) {
    return (
      // A plain image: the glass refracts whatever the page paints behind it.
      <img alt="" src={backdrop.src} className="absolute inset-0 size-full object-cover" />
    );
  }
  return (
    <div className="absolute inset-0">
      <MeshGradient className="size-full" colors={["#0b1020", "#ff6a3d", "#7a5cff", "#18c3a5"]} speed={0.5} />
      {/* Two lines of type that cross the top and bottom edges of the
          panel, where the glass bends them, and leave its middle clear. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex select-none flex-col items-center justify-center gap-[5.5rem] text-[56px] leading-none font-semibold tracking-tight text-white/85 sm:text-[80px]"
      >
        <span>Refract the</span>
        <span>light behind it.</span>
      </div>
    </div>
  );
}

export default function LiquidGlassDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const { backdrop, ...glass } = settings;
  // Text on glass is read against the backdrop, not the page theme, so the
  // tint and text color follow the scene behind the panel.
  const tone = (backdrops.find((item) => item.value === backdrop) ?? backdrops[0]).tone;
  const tint = tone === "light" ? "rgba(255, 255, 255, 0.22)" : "rgba(12, 14, 20, 0.28)";
  const props = { ...glass, tint };
  const code = buildShaderCode({
    componentName: "LiquidGlass",
    supportsClassName: false,
    props: Object.entries(props) as [string, string | number | boolean][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={reset}
      title="Liquid Glass"
      preview={
        <div
          className={`relative grid size-full place-items-center overflow-hidden ${
            tone === "light" ? "bg-[#ebe6de]" : "bg-neutral-900"
          }`}
        >
          <Backdrop value={backdrop} />
          <LiquidGlass className="w-[min(78%,22rem)]" {...props}>
            <div className={`flex flex-col gap-1 px-6 py-5 ${tone === "light" ? "text-neutral-950" : "text-white"}`}>
              <span className="text-[13px] font-medium opacity-70">Now playing</span>
              <span className="text-lg font-semibold tracking-tight">Glass Houses</span>
              <span className="text-[13px] opacity-70">Lumen Arc · 3:42</span>
            </div>
          </LiquidGlass>
        </div>
      }
    >
      <ShaderSelectControl
        className="col-span-2"
        label="Backdrop"
        onChange={(value) => update("backdrop", value)}
        options={backdrops.map(({ label, value }) => ({ label, value }))}
        value={settings.backdrop}
      />
      <ShaderSliderControl label="Radius" max={64} min={0} onChange={(value) => update("radius", value)} step={1} value={settings.radius} />
      <ShaderSliderControl label="Bezel" max={48} min={4} onChange={(value) => update("bezel", value)} step={1} value={settings.bezel} />
      <ShaderSliderControl label="Refraction" max={1} min={0} onChange={(value) => update("refraction", value)} step={0.01} value={settings.refraction} />
      <ShaderSliderControl label="Dispersion" max={1} min={0} onChange={(value) => update("dispersion", value)} step={0.01} value={settings.dispersion} />
      <ShaderSliderControl label="Frost" max={1} min={0} onChange={(value) => update("frost", value)} step={0.01} value={settings.frost} />
      <ShaderSliderControl label="Saturation" max={2.5} min={0} onChange={(value) => update("saturation", value)} step={0.05} value={settings.saturation} />
      <ShaderSliderControl label="Specular" max={1} min={0} onChange={(value) => update("specular", value)} step={0.01} value={settings.specular} />
      <ShaderSliderControl label="Light angle" max={360} min={0} onChange={(value) => update("lightAngle", value)} step={1} value={settings.lightAngle} />
      <ShaderSwitchControl checked={settings.interactive} label="Follow pointer" onChange={(value) => update("interactive", value)} />
    </ShaderPlayground>
  );
}
