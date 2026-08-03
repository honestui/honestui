"use client";

export { default as GradientBlinds } from "@/registry/default/shaders/blinds";
export { default as Dither } from "@/registry/default/shaders/dithering";
export { default as Grainient } from "@/registry/default/shaders/grainient";
export { default as GridDistortion } from "@/registry/default/shaders/grid-distortion";
export { default as LightRays } from "@/registry/default/shaders/light-rays";

export type { GradientBlindsProps } from "@/registry/default/shaders/blinds";
export type { DitherProps } from "@/registry/default/shaders/dithering";
export type { GrainientProps } from "@/registry/default/shaders/grainient";
export type { GridDistortionProps } from "@/registry/default/shaders/grid-distortion";
export type {
  LightRaysProps,
  RaysOrigin,
} from "@/registry/default/shaders/light-rays";
