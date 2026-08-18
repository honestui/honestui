"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type DitheringMode = "bayer" | "halftone" | "noise" | "crosshatch";
export type DitherColorMode = "original" | "grayscale" | "duotone" | "custom";
export type DitherSourceMode = "image" | "waves";

interface DitherShaderBaseProps {
  /** Size of the dithering grid cells */
  gridSize?: number;
  /** Type of dithering pattern */
  ditherMode?: DitheringMode;
  /** Color processing mode */
  colorMode?: DitherColorMode;
  /** Invert the dithered output colors */
  invert?: boolean;
  /** Pixelation multiplier (1 = no pixelation, higher = more pixelated) */
  pixelRatio?: number;
  /** Primary color for duotone mode */
  primaryColor?: string;
  /** Secondary color for duotone mode */
  secondaryColor?: string;
  /** Custom color palette array for custom mode */
  customPalette?: string[];
  /** Brightness adjustment (-1 to 1) */
  brightness?: number;
  /** Contrast adjustment (0 to 2, 1 = normal) */
  contrast?: number;
  /** Background color behind the dithered image */
  backgroundColor?: string;
  /** Object fit behavior */
  objectFit?: "cover" | "contain" | "fill" | "none";
  /** Threshold bias for dithering (0 to 1) */
  threshold?: number;
  /** Enable animation effect */
  animated?: boolean;
  /** Animation speed (lower = slower) */
  animationSpeed?: number;
  /** Number of channel levels retained in original color mode */
  colorCount?: number;
  /** Travel speed of the procedural wave field */
  waveSpeed?: number;
  /** Frequency multiplier between wave octaves */
  waveFrequency?: number;
  /** Amplitude multiplier between wave octaves */
  waveAmplitude?: number;
  /** Base color of the procedural wave field */
  waveColor?: string;
  /** Let the pointer darken and reshape the procedural wave field */
  enableMouseInteraction?: boolean;
  /** Radius of the pointer influence in normalized canvas units */
  mouseRadius?: number;
  /** Additional CSS classes for the container (use this to set size via Tailwind) */
  className?: string;
}

interface DitherImageSourceProps {
  /** Render a source image. This is the default mode. */
  sourceMode?: "image";
  /** Source image URL */
  src: string;
  /** Alternative text for the source image */
  alt: string;
}

interface DitherWaveSourceProps {
  /** Render a procedural wave field instead of an image. */
  sourceMode: "waves";
  src?: never;
  alt?: never;
}

export type DitherShaderProps = DitherShaderBaseProps &
  (DitherImageSourceProps | DitherWaveSourceProps);

// 4x4 Bayer matrix for ordered dithering
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// 8x8 Bayer matrix for finer dithering
const BAYER_MATRIX_8x8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const DEFAULT_CUSTOM_PALETTE = ["#000000", "#ffffff"];

function parseColor(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const match = color.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return [0, 0, 0];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const position = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  return position * position * (3 - 2 * position);
}

function noise2d(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xFraction = x - x0;
  const yFraction = y - y0;
  const fadeX = xFraction * xFraction * xFraction *
    (xFraction * (xFraction * 6 - 15) + 10);
  const fadeY = yFraction * yFraction * yFraction *
    (yFraction * (yFraction * 6 - 15) + 10);
  const hash = (hashX: number, hashY: number) => {
    const value = Math.sin(hashX * 127.1 + hashY * 311.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  };
  const top = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * fadeX;
  const bottom =
    hash(x0, y0 + 1) +
    (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * fadeX;
  return top + (bottom - top) * fadeY;
}

function waveFbm(
  x: number,
  y: number,
  frequency: number,
  amplitude: number,
) {
  let value = 0;
  let octaveAmplitude = 1;
  let sampleX = x;
  let sampleY = y;

  for (let octave = 0; octave < 4; octave += 1) {
    value += octaveAmplitude * Math.abs(noise2d(sampleX, sampleY));
    sampleX *= frequency;
    sampleY *= frequency;
    octaveAmplitude *= amplitude;
  }

  return value;
}

export const DitherShader: React.FC<DitherShaderProps> = ({
  sourceMode = "image",
  src,
  alt,
  gridSize = 4,
  ditherMode = "bayer",
  colorMode = "original",
  invert = false,
  pixelRatio = 1,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  customPalette = DEFAULT_CUSTOM_PALETTE,
  brightness = 0,
  contrast = 1,
  backgroundColor = "transparent",
  objectFit = "cover",
  threshold = 0.5,
  animated,
  animationSpeed = 0.02,
  colorCount = 4,
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = "#808080",
  enableMouseInteraction = true,
  mouseRadius = 1,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const pointerRef = useRef({ active: false, x: 0.5, y: 0.5 });
  const renderCurrentFrameRef = useRef<(() => void) | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  const parsedPrimaryColor = useMemo(
    () => parseColor(primaryColor),
    [primaryColor],
  );
  const parsedSecondaryColor = useMemo(
    () => parseColor(secondaryColor),
    [secondaryColor],
  );
  const parsedCustomPalette = useMemo(
    () =>
      (customPalette.length >= 2 ? customPalette : DEFAULT_CUSTOM_PALETTE).map(
        parseColor,
      ),
    [customPalette],
  );
  const parsedWaveColor = useMemo(() => parseColor(waveColor), [waveColor]);
  const isAnimated = animated ?? sourceMode === "waves";

  const applyDithering = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      displayWidth: number,
      displayHeight: number,
      time: number = 0,
    ) => {
      const canvas = canvasRef.current;
      const imageData = imageDataRef.current;
      if (!canvas || (sourceMode === "image" && !imageData)) return;

      // Clear with background
      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      } else {
        ctx.clearRect(0, 0, displayWidth, displayHeight);
      }

      const sourceData = imageData?.data;
      const sourceWidth = imageData?.width ?? 0;
      const sourceHeight = imageData?.height ?? 0;

      const cellSize = Math.max(1, gridSize);
      const effectivePixelSize = Math.max(1, Math.floor(cellSize * pixelRatio));
      const matrixSize = cellSize <= 4 ? 4 : 8;
      const bayerMatrix = cellSize <= 4 ? BAYER_MATRIX_4x4 : BAYER_MATRIX_8x8;
      const matrixScale = matrixSize === 4 ? 16 : 64;

      // Process pixels
      for (let y = 0; y < displayHeight; y += effectivePixelSize) {
        for (let x = 0; x < displayWidth; x += effectivePixelSize) {
          let r: number;
          let g: number;
          let b: number;

          if (sourceMode === "waves") {
            const aspect = displayWidth / displayHeight;
            const waveX = (x / displayWidth - 0.5) * aspect;
            const waveY = y / displayHeight - 0.5;
            const travelledX = waveX - time * waveSpeed;
            const travelledY = waveY - time * waveSpeed;
            const nestedWave = waveFbm(
              travelledX,
              travelledY,
              waveFrequency,
              waveAmplitude,
            );
            let intensity = waveFbm(
              waveX + nestedWave,
              waveY + nestedWave,
              waveFrequency,
              waveAmplitude,
            );

            const pointer = pointerRef.current;
            if (enableMouseInteraction && pointer.active) {
              const pointerX = (pointer.x - 0.5) * aspect;
              const pointerY = pointer.y - 0.5;
              const distance = Math.hypot(
                waveX - pointerX,
                waveY - pointerY,
              );
              const influence = 1 - smoothstep(
                0,
                Math.max(0.001, mouseRadius),
                distance,
              );
              intensity -= 0.5 * influence;
            }

            intensity = clamp(intensity, 0, 1);
            r = parsedWaveColor[0] * intensity;
            g = parsedWaveColor[1] * intensity;
            b = parsedWaveColor[2] * intensity;
          } else {
            const srcX = Math.floor((x / displayWidth) * sourceWidth);
            const srcY = Math.floor((y / displayHeight) * sourceHeight);
            const srcIdx = (srcY * sourceWidth + srcX) * 4;
            const alpha = sourceData?.[srcIdx + 3] ?? 0;

            if (alpha < 10) continue;
            r = sourceData?.[srcIdx] ?? 0;
            g = sourceData?.[srcIdx + 1] ?? 0;
            b = sourceData?.[srcIdx + 2] ?? 0;
          }

          // Apply brightness and contrast
          r = clamp((r - 128) * contrast + 128 + brightness * 255, 0, 255);
          g = clamp((g - 128) * contrast + 128 + brightness * 255, 0, 255);
          b = clamp((b - 128) * contrast + 128 + brightness * 255, 0, 255);

          // Calculate luminance
          const luminance = getLuminance(r, g, b) / 255;

          // Get dither threshold based on mode
          let ditherThreshold: number;
          const matrixX = Math.floor(x / cellSize) % matrixSize;
          const matrixY = Math.floor(y / cellSize) % matrixSize;

          switch (ditherMode) {
            case "bayer":
              ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
              break;
            case "halftone": {
              const angle = Math.PI / 4;
              const scale = cellSize * 2;
              const rotX = x * Math.cos(angle) + y * Math.sin(angle);
              const rotY = -x * Math.sin(angle) + y * Math.cos(angle);
              const pattern =
                (Math.sin(rotX / scale) + Math.sin(rotY / scale) + 2) / 4;
              ditherThreshold = pattern;
              break;
            }
            case "noise": {
              const noiseVal =
                Math.sin(x * 12.9898 + y * 78.233 + time * 100) * 43758.5453;
              ditherThreshold = noiseVal - Math.floor(noiseVal);
              break;
            }
            case "crosshatch": {
              const line1 = (x + y) % (cellSize * 2) < cellSize ? 1 : 0;
              const line2 =
                (x - y + cellSize * 4) % (cellSize * 2) < cellSize ? 1 : 0;
              ditherThreshold = (line1 + line2) / 2;
              break;
            }
            default:
              ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
          }

          // Adjust threshold with user setting
          ditherThreshold = ditherThreshold * (1 - threshold) + threshold * 0.5;

          // Determine output color based on color mode
          let outputColor: [number, number, number];

          switch (colorMode) {
            case "grayscale": {
              const shouldBeDark = luminance < ditherThreshold;
              outputColor = shouldBeDark ? [0, 0, 0] : [255, 255, 255];
              break;
            }
            case "duotone": {
              const shouldBeDark = luminance < ditherThreshold;
              outputColor = shouldBeDark
                ? parsedPrimaryColor
                : parsedSecondaryColor;
              break;
            }
            case "custom": {
              if (parsedCustomPalette.length === 2) {
                const shouldBeDark = luminance < ditherThreshold;
                outputColor = shouldBeDark
                  ? parsedCustomPalette[0]
                  : parsedCustomPalette[1];
              } else {
                // Quantize to closest palette color with dithering
                const adjustedLuminance =
                  luminance + (ditherThreshold - 0.5) * 0.5;
                const paletteIndex = Math.floor(
                  clamp(adjustedLuminance, 0, 1) *
                    (parsedCustomPalette.length - 1),
                );
                outputColor = parsedCustomPalette[paletteIndex];
              }
              break;
            }
            case "original":
            default: {
              // Apply dithering while preserving colors
              const ditherAmount = ditherThreshold - 0.5;
              const adjustedR = clamp(r + ditherAmount * 64, 0, 255);
              const adjustedG = clamp(g + ditherAmount * 64, 0, 255);
              const adjustedB = clamp(b + ditherAmount * 64, 0, 255);

              // Quantize to fewer levels for dithered look
              const levels = Math.max(2, Math.round(colorCount));
              outputColor = [
                Math.round(adjustedR / (255 / levels)) * (255 / levels),
                Math.round(adjustedG / (255 / levels)) * (255 / levels),
                Math.round(adjustedB / (255 / levels)) * (255 / levels),
              ];
              break;
            }
          }

          // Apply inversion
          if (invert) {
            outputColor = [
              255 - outputColor[0],
              255 - outputColor[1],
              255 - outputColor[2],
            ];
          }

          // Draw the pixel
          ctx.fillStyle = `rgb(${outputColor[0]}, ${outputColor[1]}, ${outputColor[2]})`;
          ctx.fillRect(x, y, effectivePixelSize, effectivePixelSize);
        }
      }
    },
    [
      gridSize,
      ditherMode,
      colorMode,
      invert,
      pixelRatio,
      parsedPrimaryColor,
      parsedSecondaryColor,
      parsedCustomPalette,
      brightness,
      contrast,
      backgroundColor,
      threshold,
      sourceMode,
      waveSpeed,
      waveFrequency,
      waveAmplitude,
      parsedWaveColor,
      enableMouseInteraction,
      mouseRadius,
      colorCount,
    ],
  );

  // Setup resize observer for responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Prepare the selected source and apply dithering when its inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    let isCancelled = false;
    setReady(false);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.round(dimensions.width));
    const displayHeight = Math.max(1, Math.round(dimensions.height));

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const renderCurrentFrame = () => {
      applyDithering(ctx, displayWidth, displayHeight, timeRef.current);
    };
    renderCurrentFrameRef.current = renderCurrentFrame;

    const startRendering = () => {
      renderCurrentFrame();
      setReady(true);

      if (isAnimated && !reduceMotion) {
        const animate = () => {
          if (isCancelled) return;
          timeRef.current += animationSpeed;
          renderCurrentFrame();
          animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    const cleanup = () => {
      isCancelled = true;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (renderCurrentFrameRef.current === renderCurrentFrame) {
        renderCurrentFrameRef.current = null;
      }
    };

    if (sourceMode === "waves") {
      imageDataRef.current = null;
      startRendering();
      return cleanup;
    }

    if (!src) return cleanup;

    const processImage = (img: HTMLImageElement) => {
      if (isCancelled) return;

      // Create offscreen canvas to get image data
      const offscreen = document.createElement("canvas");
      const iw = img.naturalWidth || displayWidth;
      const ih = img.naturalHeight || displayHeight;

      let dw = displayWidth;
      let dh = displayHeight;
      let dx = 0;
      let dy = 0;

      if (objectFit === "cover") {
        const scale = Math.max(displayWidth / iw, displayHeight / ih);
        dw = Math.ceil(iw * scale);
        dh = Math.ceil(ih * scale);
        dx = Math.floor((displayWidth - dw) / 2);
        dy = Math.floor((displayHeight - dh) / 2);
      } else if (objectFit === "contain") {
        const scale = Math.min(displayWidth / iw, displayHeight / ih);
        dw = Math.ceil(iw * scale);
        dh = Math.ceil(ih * scale);
        dx = Math.floor((displayWidth - dw) / 2);
        dy = Math.floor((displayHeight - dh) / 2);
      } else if (objectFit === "fill") {
        dw = displayWidth;
        dh = displayHeight;
      } else {
        dw = iw;
        dh = ih;
        dx = Math.floor((displayWidth - dw) / 2);
        dy = Math.floor((displayHeight - dh) / 2);
      }

      offscreen.width = displayWidth;
      offscreen.height = displayHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.drawImage(img, dx, dy, dw, dh);

      try {
        imageDataRef.current = offCtx.getImageData(
          0,
          0,
          displayWidth,
          displayHeight,
        );
      } catch {
        setReady(false);
        return;
      }

      startRendering();
    };

    // If image is already loaded, reprocess it
    const resolvedSource = new URL(src, window.location.href).href;
    if (
      imageRef.current &&
      imageRef.current.complete &&
      imageRef.current.src === resolvedSource
    ) {
      processImage(imageRef.current);
    } else {
      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;

      img.onload = () => {
        if (isCancelled) return;
        imageRef.current = img;
        processImage(img);
      };

      img.onerror = () => {
        setReady(false);
      };
    }

    return cleanup;
  }, [
    src,
    sourceMode,
    dimensions,
    objectFit,
    isAnimated,
    animationSpeed,
    applyDithering,
  ]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sourceMode !== "waves" || !enableMouseInteraction) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      active: true,
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
    renderCurrentFrameRef.current?.();
  };

  const handlePointerLeave = () => {
    if (sourceMode !== "waves") return;
    pointerRef.current.active = false;
    renderCurrentFrameRef.current?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className ?? ""}`.trim()}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      {sourceMode === "image" && src ? (
        <img
          alt={alt ?? ""}
          className={`absolute inset-0 size-full transition-opacity duration-300 ${ready ? "opacity-0" : "opacity-100"}`}
          src={src}
          style={{ objectFit }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
};

export default DitherShader;
