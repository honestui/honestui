"use client";

import * as React from "react";
import {
  buildShaderCode,
  ShaderColorListControl,
  ShaderPlayground,
  ShaderSelectControl,
  ShaderSliderControl,
  ShaderSwitchControl,
  useShaderSettings,
} from "@/components/docs/shaders/shader-playground";
import { AudioOrb, type AudioOrbState } from "honestui/shaders";

interface AudioOrbSettings {
  state: AudioOrbState;
  colors: string[];
  speed: number;
  grain: number;
  paused: boolean;
}

const defaults: AudioOrbSettings = {
  state: "speaking",
  colors: ["#f3f1ff", "#8a94ff", "#272a63"],
  speed: 1,
  grain: 0.5,
  paused: false,
};

const STATES = [
  { label: "Idle", value: "idle" },
  { label: "Listening", value: "listening" },
  { label: "Thinking", value: "thinking" },
  { label: "Speaking", value: "speaking" },
] as const;

/** A speech-like level: syllables inside words inside phrases, scaled by `loudness`. */
function useSimulatedVoice(loudness: number) {
  const loudnessRef = React.useRef(loudness);
  React.useEffect(() => {
    loudnessRef.current = loudness;
  });
  return React.useCallback(() => {
    const t = performance.now() / 1000;
    const syllables = 0.55 + 0.45 * Math.abs(Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1.3));
    const words = Math.max(0, Math.sin(t * 2.3) * 0.6 + 0.55);
    const phrase = Math.sin(t * 0.55) > -0.6 ? 1 : 0.1;
    return Math.min(1, syllables * words * phrase * loudnessRef.current);
  }, []);
}

export default function AudioOrbDemo() {
  const { settings, update, reset } = useShaderSettings(defaults);
  const [loudness, setLoudness] = React.useState(0.8);
  const level = useSimulatedVoice(loudness);
  const code = buildShaderCode({
    componentName: "AudioOrb",
    props: Object.entries(settings) as [keyof AudioOrbSettings, AudioOrbSettings[keyof AudioOrbSettings]][],
  });

  return (
    <ShaderPlayground
      code={code}
      onReset={() => {
        reset();
        setLoudness(0.8);
      }}
      preview={
        <div className="grid size-full place-items-center">
          <div className="size-full max-w-[22rem]">
            <AudioOrb {...settings} inputLevel={level} outputLevel={level} />
          </div>
        </div>
      }
      title="Audio Orb"
    >
      <ShaderSelectControl
        label="State"
        onChange={(value) => update("state", value as AudioOrbState)}
        options={STATES}
        value={settings.state}
      />
      <ShaderSliderControl label="Simulated loudness" max={1} min={0} onChange={setLoudness} step={0.01} value={loudness} />
      <ShaderColorListControl
        label="Colors"
        maxColors={3}
        minColors={3}
        onChange={(value) => update("colors", value)}
        values={settings.colors}
      />
      <ShaderSliderControl label="Speed" max={2} min={0} onChange={(value) => update("speed", value)} step={0.05} value={settings.speed} />
      <ShaderSliderControl label="Grain" max={1} min={0} onChange={(value) => update("grain", value)} step={0.01} value={settings.grain} />
      <ShaderSwitchControl checked={settings.paused} label="Paused" onChange={(value) => update("paused", value)} />
    </ShaderPlayground>
  );
}
