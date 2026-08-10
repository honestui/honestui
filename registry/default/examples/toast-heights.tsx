"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { toastManager } from "@/registry/default/ui/toast";

const TEXTS = [
  "Short message.",
  "A bit longer message that spans two lines.",
  "This is a longer description that intentionally takes more vertical space to demonstrate stacking with varying heights.",
  "An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.",
];

export default function ToastHeights() {
  const [count, setCount] = React.useState(0);

  function createToast() {
    const nextCount = count + 1;
    setCount(nextCount);
    const description = TEXTS[(nextCount - 1) % TEXTS.length];
    toastManager.add({
      title: `Notification ${nextCount}`,
      description,
    });
  }

  return (
    <Button variant="secondary" onClick={createToast}>
      With Varying Heights
    </Button>
  );
}
