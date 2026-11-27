"use client";

import { CompareSlider } from "@/registry/default/animated/compare-slider";

const PHOTO =
  "https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85";

export default function CompareSliderDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <CompareSlider
        className="aspect-[16/10] w-full"
        beforeLabel="Original"
        afterLabel="Graded"
        defaultPosition={42}
        before={
          <img
            src={PHOTO}
            alt="Apartment blocks painted teal and orange, flat and unedited"
            draggable={false}
            className="[filter:saturate(0.25)_contrast(0.82)_brightness(1.08)]"
          />
        }
        after={
          <img
            src={PHOTO}
            alt="The same buildings after color grading, with richer teal and orange"
            draggable={false}
            className="[filter:saturate(1.35)_contrast(1.08)]"
          />
        }
      />
      <p className="text-center text-sm text-muted-foreground">
        Drag the divider, click anywhere on the photo, or focus the handle and use the arrow keys.
      </p>
    </div>
  );
}
