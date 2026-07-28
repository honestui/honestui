"use client";

import { GridDistortion } from "honestui/shaders";

export default function GridDistortionDemo() {
  return (
    <div className="size-full bg-[#f1efe8] p-10 dark:bg-[#15191f]">
      <GridDistortion
        className="rounded-sm"
        grid={18}
        imageSrc="/logo-wordmark.svg"
        mouse={0.18}
        relaxation={0.92}
        strength={0.22}
      />
    </div>
  );
}
