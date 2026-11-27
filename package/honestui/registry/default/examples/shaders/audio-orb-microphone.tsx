"use client";

import * as React from "react";
import { AudioOrb } from "honestui/shaders";

import { Button } from "@/registry/default/ui/button";

/**
 * The microphone opens only when the button is pressed, and every track stops
 * when it is pressed again or the preview unmounts. The orb analyses the
 * stream itself; nothing is recorded or sent anywhere.
 */
export default function AudioOrbMicrophone() {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const toggle = async () => {
    if (stream) {
      setStream(null);
      return;
    }
    setError(null);
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: true }));
    } catch {
      setError("The microphone is unavailable or was not allowed.");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 py-6">
      <AudioOrb state={stream ? "listening" : "idle"} stream={stream} size={200} />
      <div className="flex min-h-9 flex-col items-center gap-2">
        <Button size="sm" variant={stream ? "secondary" : "default"} onClick={toggle}>
          {stream ? "Stop" : "Use microphone"}
        </Button>
        {error ? (
          <p role="alert" className="text-muted-foreground m-0 text-xs">
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground m-0 text-xs">
            {stream ? "Speak, and the surface follows your voice." : "Nothing is recorded."}
          </p>
        )}
      </div>
    </div>
  );
}
