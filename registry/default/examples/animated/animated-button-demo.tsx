"use client";

import { ArrowRight, Send } from "lucide-react";
import { useState } from "react";

import {
  Button,
  MagneticButton,
  StatefulButton,
  type ButtonState,
} from "@/registry/default/animated/button";

export default function AnimatedButtonDemo() {
  const [state, setState] = useState<ButtonState>("idle");

  const submit = () => {
    if (state === "loading") return;
    setState("loading");
    window.setTimeout(() => setState("success"), 900);
    window.setTimeout(() => setState("idle"), 2200);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-6">
      <Button ripple>
        Continue <ArrowRight className="size-4" />
      </Button>
      <MagneticButton variant="outline" strength={0.3}>
        Magnetic
      </MagneticButton>
      <StatefulButton state={state} onClick={submit} icon={<Send className="size-4" />}>
        Send invite
      </StatefulButton>
    </div>
  );
}
