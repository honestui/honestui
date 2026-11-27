"use client";

import { ScrollVelocityText } from "@/registry/default/animated/scroll-velocity-text";

export default function ScrollVelocityTextDemo() {
  return (
    <div className="flex w-full flex-col gap-4 py-6">
      <ScrollVelocityText
        rows={[
          "Design with intent",
          <span key="care" className="text-muted-foreground">
            Ship with care
          </span>,
        ]}
        className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      />
      <p className="text-center text-xs text-muted-foreground">Scroll the page to speed it up.</p>
    </div>
  );
}
