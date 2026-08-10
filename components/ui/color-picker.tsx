"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui-components/react/slider"
import {
  clampChroma,
  clampRgb,
  converter,
  formatHex,
  formatHex8,
  formatHsl,
  formatRgb,
  parse,
  toGamut,
} from "culori"

import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const SUPPORTED_MODES = ["hex", "hsl", "rgb", "oklch"] as const
const CHROMA_MAX = 0.4
const CANVAS_RESOLUTION = 96
const AREA_STEP = 0.01
const AREA_STEP_LARGE = 0.1

type ModeType = (typeof SUPPORTED_MODES)[number]

type ColorObject = {
  l: number
  c: number
  h: number
  alpha?: number
}

type ColorPickerContextValue = ColorObject & {
  alpha: number
  mode: ModeType
  setColor: (color: Partial<ColorObject>) => void
  setMode: (mode: ModeType) => void
}

const toOklch = converter("oklch")
const toRgb = converter("rgb")
const toHsl = converter("hsl")
const toSrgb = toGamut("rgb", "oklch")
const FALLBACK_COLOR: ColorObject = { l: 1, c: 0, h: 0, alpha: 1 }

const ColorPickerContext = React.createContext<
  ColorPickerContextValue | undefined
>(undefined)

function useColorPicker() {
  const context = React.useContext(ColorPickerContext)

  if (!context) {
    throw new Error("ColorPicker components must be used within ColorPicker")
  }

  return context
}

function round(value: number, precision: number) {
  return Number.parseFloat(value.toFixed(precision))
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function normalizeHue(value: number) {
  return ((value % 360) + 360) % 360
}

function parseColor(value: string): ColorObject {
  const parsed = parse(value)
  if (!parsed) return FALLBACK_COLOR

  const oklch = toOklch(parsed)
  if (!oklch) return FALLBACK_COLOR

  const chroma = oklch.c ?? 0
  return {
    l: oklch.l ?? 0,
    c: chroma,
    h:
      chroma === 0 || !Number.isFinite(oklch.h)
        ? 0
        : normalizeHue(oklch.h as number),
    alpha: oklch.alpha ?? 1,
  }
}

function formatOklch(color: ColorObject) {
  const lightness = round(color.l, 4)
  const chroma = round(color.c, 4)
  const hue = chroma === 0 ? 0 : round(normalizeHue(color.h), 2)
  const alpha = color.alpha ?? 1
  const body = `${lightness} ${chroma} ${hue}`

  return alpha === 1
    ? `oklch(${body})`
    : `oklch(${body} / ${round(alpha, 4)})`
}

function formatColor(
  value: string,
  format: "hex" | "rgb" | "hsl" | "oklch"
) {
  const parsed = parse(value)
  if (!parsed) return null

  if (format === "oklch") {
    const oklch = toOklch(parsed)
    if (!oklch) return null

    return formatOklch({
      l: oklch.l ?? 0,
      c: oklch.c ?? 0,
      h: Number.isFinite(oklch.h) ? (oklch.h as number) : 0,
      alpha: oklch.alpha ?? 1,
    })
  }

  const safe = toSrgb(parsed)
  if (!safe) return null

  if (format === "hex") {
    const hex =
      (safe.alpha ?? 1) === 1 ? formatHex(safe) : formatHex8(safe)
    return hex?.toUpperCase() ?? null
  }

  if (format === "hsl") return formatHsl(safe) ?? null
  return formatRgb(safe) ?? null
}

function getColorString(color: ColorObject, mode: ModeType) {
  if (mode === "oklch") return formatOklch(color)

  const rgb = toRgb({
    mode: "oklch",
    l: color.l,
    c: color.c,
    h: color.h,
    alpha: color.alpha ?? 1,
  })
  if (!rgb) return ""

  const clipped = clampRgb(rgb)
  if (mode === "hex") {
    const hex =
      (clipped.alpha ?? 1) === 1
        ? formatHex(clipped)
        : formatHex8(clipped)
    return hex?.toUpperCase() ?? ""
  }

  if (mode === "hsl") return formatHsl(clipped) ?? ""
  return formatRgb(clipped) ?? ""
}

function oklchToRgb(lightness: number, chroma: number, hue: number) {
  return toRgb({ mode: "oklch", l: lightness, c: chroma, h: hue })
}

type HslColor = {
  h: number
  s: number
  l: number
}

function oklchToHsl(color: ColorObject): HslColor {
  const hsl = toHsl({
    mode: "oklch",
    l: color.l,
    c: color.c,
    h: color.h,
    alpha: color.alpha ?? 1,
  })

  if (!hsl) return { h: color.h, s: 0, l: 100 }

  return {
    h:
      color.c <= 1e-6 || !Number.isFinite(hsl.h)
        ? color.h
        : normalizeHue(hsl.h as number),
    s: clamp01(hsl.s ?? 0) * 100,
    l: clamp01(hsl.l ?? 0) * 100,
  }
}

function hslToOklch(
  hue: number,
  saturation: number,
  lightness: number,
  alpha = 1
): ColorObject {
  const oklch = toOklch({
    mode: "hsl",
    h: normalizeHue(hue),
    s: clamp01(saturation / 100),
    l: clamp01(lightness / 100),
    alpha,
  })

  if (!oklch) return { l: 0, c: 0, h: hue, alpha }

  return {
    l: oklch.l ?? 0,
    c: oklch.c ?? 0,
    h: Number.isFinite(oklch.h) ? (oklch.h as number) : hue,
    alpha,
  }
}

function clampToSrgb(color: ColorObject): ColorObject {
  const result = clampChroma(
    {
      mode: "oklch",
      l: color.l,
      c: color.c,
      h: color.h,
      alpha: color.alpha ?? 1,
    },
    "oklch",
    "rgb"
  )

  return {
    l: result.l ?? color.l,
    c: result.c ?? 0,
    h: result.h ?? color.h,
    alpha: result.alpha ?? color.alpha ?? 1,
  }
}

type ColorPickerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, mode: ModeType) => void
  defaultMode?: ModeType
  mode?: ModeType
  onModeChange?: (mode: ModeType) => void
}

function ColorPickerRoot({
  value,
  defaultValue = "#FFFFFF",
  onValueChange,
  defaultMode = "hex",
  mode: providedMode,
  onModeChange,
  className,
  ...props
}: ColorPickerProps) {
  const providedColor = React.useMemo(
    () => (value ? parseColor(value) : undefined),
    [value]
  )
  const [internalColor, setInternalColor] = React.useState(() =>
    parseColor(defaultValue)
  )
  const [internalMode, setInternalMode] = React.useState(defaultMode)
  const mode = providedMode ?? internalMode

  const rawColor = React.useMemo<ColorObject>(
    () => ({
      l: providedColor?.l ?? internalColor.l,
      c: providedColor?.c ?? internalColor.c,
      h: providedColor?.h ?? internalColor.h,
      alpha: providedColor?.alpha ?? internalColor.alpha ?? 1,
    }),
    [internalColor, providedColor]
  )
  const displayedColor = React.useMemo(
    () => (mode === "oklch" ? rawColor : clampToSrgb(rawColor)),
    [mode, rawColor]
  )
  const rawColorRef = React.useRef(rawColor)

  React.useEffect(() => {
    rawColorRef.current = rawColor
  }, [rawColor])

  const setColor = React.useCallback(
    (nextColor: Partial<ColorObject>) => {
      const next = { ...rawColorRef.current, ...nextColor }
      rawColorRef.current = next

      if (value === undefined) {
        setInternalColor(next)
      }

      onValueChange?.(getColorString(next, mode), mode)
    },
    [mode, onValueChange, value]
  )

  const setMode = React.useCallback(
    (nextMode: ModeType) => {
      if (providedMode === undefined) {
        setInternalMode(nextMode)
      }
      onModeChange?.(nextMode)
    },
    [onModeChange, providedMode]
  )

  const contextValue = React.useMemo<ColorPickerContextValue>(
    () => ({
      l: displayedColor.l,
      c: displayedColor.c,
      h: displayedColor.h,
      alpha: displayedColor.alpha ?? 1,
      mode,
      setColor,
      setMode,
    }),
    [displayedColor, mode, setColor, setMode]
  )

  return (
    <ColorPickerContext.Provider value={contextValue}>
      <div
        data-slot="color-picker"
        className={cn(
          "flex w-full flex-col gap-[var(--hui-space-4)]",
          className
        )}
        {...props}
      />
    </ColorPickerContext.Provider>
  )
}

ColorPickerRoot.displayName = "ColorPicker"

type ColorPickerAreaProps = React.ComponentProps<"div">

function ColorPickerArea(props: ColorPickerAreaProps) {
  const { mode } = useColorPicker()
  return mode === "oklch" ? (
    <OklchColorArea {...props} />
  ) : (
    <HslColorArea {...props} />
  )
}

ColorPickerArea.displayName = "ColorPicker.Area"

function getAreaPoint(
  event: React.PointerEvent<HTMLDivElement>,
  element: HTMLDivElement
) {
  const rect = element.getBoundingClientRect()
  return {
    x: clamp01((event.clientX - rect.left) / rect.width),
    y: clamp01((event.clientY - rect.top) / rect.height),
  }
}

function OklchColorArea({
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  "aria-label": ariaLabel = "Color area, chroma and lightness",
  ...props
}: ColorPickerAreaProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const draggingRef = React.useRef(false)
  const { l: lightness, c: chroma, h: hue, setColor } = useColorPicker()

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return

      const context = canvas.getContext("2d")
      if (!context) return

      const image = context.createImageData(
        CANVAS_RESOLUTION,
        CANVAS_RESOLUTION
      )

      for (let y = 0; y < CANVAS_RESOLUTION; y += 1) {
        const nextLightness = 1 - y / (CANVAS_RESOLUTION - 1)
        for (let x = 0; x < CANVAS_RESOLUTION; x += 1) {
          const nextChroma =
            (x / (CANVAS_RESOLUTION - 1)) * CHROMA_MAX
          const rgb = oklchToRgb(nextLightness, nextChroma, hue)
          const index = (y * CANVAS_RESOLUTION + x) * 4

          image.data[index] = Math.round(clamp01(rgb?.r ?? 0.5) * 255)
          image.data[index + 1] = Math.round(
            clamp01(rgb?.g ?? 0.5) * 255
          )
          image.data[index + 2] = Math.round(
            clamp01(rgb?.b ?? 0.5) * 255
          )
          image.data[index + 3] = 255
        }
      }

      context.putImageData(image, 0, 0)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [hue])

  const applyPosition = React.useCallback(
    (x: number, y: number) => {
      setColor({ c: clamp01(x) * CHROMA_MAX, l: 1 - clamp01(y) })
    },
    [setColor]
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return

    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getAreaPoint(event, event.currentTarget)
    applyPosition(point.x, point.y)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (!draggingRef.current || event.defaultPrevented) return

    const point = getAreaPoint(event, event.currentTarget)
    applyPosition(point.x, point.y)
  }

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    let x = clamp01(chroma / CHROMA_MAX)
    let y = clamp01(1 - lightness)
    const step = event.shiftKey ? AREA_STEP_LARGE : AREA_STEP

    switch (event.key) {
      case "ArrowLeft":
        x -= step
        break
      case "ArrowRight":
        x += step
        break
      case "ArrowUp":
        y -= step
        break
      case "ArrowDown":
        y += step
        break
      case "PageUp":
        y -= AREA_STEP_LARGE
        break
      case "PageDown":
        y += AREA_STEP_LARGE
        break
      case "Home":
        x = 0
        break
      case "End":
        x = 1
        break
      default:
        return
    }

    event.preventDefault()
    applyPosition(x, y)
  }

  const x = clamp01(chroma / CHROMA_MAX)
  const y = clamp01(1 - lightness)
  const valueText = `chroma ${Math.round(x * 100)}%, lightness ${Math.round(
    lightness * 100
  )}%`

  return (
    <div
      {...props}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(x * 100)}
      aria-valuetext={valueText}
      data-slot="color-picker-area"
      className={cn(
        "relative aspect-square w-full touch-none overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] select-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        stopDragging(event)
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        stopDragging(event)
      }}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_RESOLUTION}
        height={CANVAS_RESOLUTION}
        className="block size-full"
        data-slot="color-picker-area-canvas"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 block size-[var(--hui-space-4)] rounded-full border-[3px] border-[var(--hui-color-foreground-base-emphasis)] shadow-[var(--hui-shadow-soft)]"
        style={{
          backgroundColor: formatOklch({
            l: lightness,
            c: chroma,
            h: hue,
          }),
          transform: "translate(-50%, -50%)",
          left: `${round(x * 100, 4)}%`,
          top: `${round(y * 100, 4)}%`,
        }}
        data-slot="color-picker-area-thumb"
      />
    </div>
  )
}

function HslColorArea({
  className,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  "aria-label": ariaLabel = "Color area, saturation and brightness",
  ...props
}: ColorPickerAreaProps) {
  const draggingRef = React.useRef(false)
  const { l: lightness, c: chroma, h: hue, setColor } = useColorPicker()
  const hsl = React.useMemo(
    () => oklchToHsl({ l: lightness, c: chroma, h: hue }),
    [chroma, hue, lightness]
  )
  const hueColor = `hsl(${round(hsl.h, 4)} 100% 50%)`

  const applyPosition = React.useCallback(
    (x: number, y: number) => {
      const nextX = clamp01(x)
      const saturation = nextX * 100
      const topLightness = nextX < 0.01 ? 100 : 50 + 50 * (1 - nextX)
      const next = hslToOklch(
        hsl.h,
        saturation,
        topLightness * (1 - clamp01(y))
      )
      setColor(next)
    },
    [hsl.h, setColor]
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return

    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getAreaPoint(event, event.currentTarget)
    applyPosition(point.x, point.y)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (!draggingRef.current || event.defaultPrevented) return

    const point = getAreaPoint(event, event.currentTarget)
    applyPosition(point.x, point.y)
  }

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    let x = clamp01(hsl.s / 100)
    const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x)
    let y = clamp01(1 - hsl.l / topLightness)
    const step = event.shiftKey ? AREA_STEP_LARGE : AREA_STEP

    switch (event.key) {
      case "ArrowLeft":
        x -= step
        break
      case "ArrowRight":
        x += step
        break
      case "ArrowUp":
        y -= step
        break
      case "ArrowDown":
        y += step
        break
      case "PageUp":
        y -= AREA_STEP_LARGE
        break
      case "PageDown":
        y += AREA_STEP_LARGE
        break
      case "Home":
        x = 0
        break
      case "End":
        x = 1
        break
      default:
        return
    }

    event.preventDefault()
    applyPosition(x, y)
  }

  const x = clamp01(hsl.s / 100)
  const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x)
  const y = clamp01(1 - hsl.l / topLightness)
  const valueText = `saturation ${Math.round(
    hsl.s
  )}%, brightness ${Math.round((hsl.l / topLightness) * 100)}%`

  return (
    <div
      {...props}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsl.s)}
      aria-valuetext={valueText}
      data-slot="color-picker-area"
      className={cn(
        "relative aspect-square w-full touch-none overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] select-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
        className
      )}
      style={{
        ...style,
        backgroundColor: hueColor,
        backgroundImage:
          "linear-gradient(0deg, rgb(0 0 0), transparent), linear-gradient(90deg, rgb(255 255 255), transparent)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        stopDragging(event)
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        stopDragging(event)
      }}
      onKeyDown={handleKeyDown}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute block size-[var(--hui-space-4)] rounded-full border-[3px] border-[var(--hui-color-foreground-base-emphasis)] shadow-[var(--hui-shadow-soft)]"
        style={{
          backgroundColor: `hsl(${round(hsl.h, 4)} ${round(hsl.s, 4)}% ${round(hsl.l, 4)}%)`,
          left: `${round(x * 100, 4)}%`,
          top: `${round(y * 100, 4)}%`,
          transform: "translate(-50%, -50%)",
        }}
        data-slot="color-picker-area-thumb"
      />
    </div>
  )
}

const sliderRootClassName =
  "relative flex w-full touch-none items-center select-none data-disabled:opacity-50"
const sliderControlClassName = "flex w-full items-center"
const sliderTrackClassName =
  "relative h-[var(--hui-space-4)] w-full grow overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
const sliderIndicatorClassName =
  "absolute h-full rounded-[var(--hui-radius-full)] bg-transparent"
const sliderThumbClassName =
  "absolute block size-[var(--hui-space-4)] rounded-full border-[3px] border-[var(--hui-color-foreground-base-emphasis)] shadow-[var(--hui-shadow-soft)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]"

type ColorPickerHueProps = Omit<
  SliderPrimitive.Root.Props,
  "defaultValue" | "max" | "min" | "onValueChange" | "step" | "value"
>

function ColorPickerHue({ className, ...props }: ColorPickerHueProps) {
  const { l: lightness, c: chroma, h: hue, mode, setColor } =
    useColorPicker()
  const isOklch = mode === "oklch"
  const hsl = React.useMemo(
    () => (isOklch ? null : oklchToHsl({ l: lightness, c: chroma, h: hue })),
    [chroma, hue, isOklch, lightness]
  )
  const value = isOklch ? hue : (hsl?.h ?? 0)

  const handleValueChange = (nextValue: number | number[]) => {
    const nextHue = Array.isArray(nextValue) ? (nextValue[0] ?? 0) : nextValue

    if (isOklch) {
      setColor({ h: nextHue })
      return
    }

    if (!hsl) return
    setColor(hslToOklch(nextHue, hsl.s, hsl.l))
  }

  return (
    <SliderPrimitive.Root
      {...props}
      className={cn(sliderRootClassName, className)}
      max={360}
      step={isOklch ? 0.1 : 1}
      value={value}
      onValueChange={handleValueChange}
      thumbAlignment="edge"
      data-slot="color-picker-hue"
    >
      <SliderPrimitive.Control
        className={sliderControlClassName}
        data-slot="color-picker-slider-control"
      >
        <SliderPrimitive.Track
          className={sliderTrackClassName}
          style={{
            background: isOklch
              ? "linear-gradient(90deg in oklch, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 360))"
              : "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
          data-slot="color-picker-slider-track"
        >
          <SliderPrimitive.Indicator
            className={sliderIndicatorClassName}
            data-slot="color-picker-slider-range"
          />
          <SliderPrimitive.Thumb
            className={sliderThumbClassName}
            aria-label={isOklch ? "OKLCH hue" : "HSL hue"}
            style={{
              backgroundColor: `hsl(${round(value, 4)} 100% 50%)`,
            }}
            data-slot="color-picker-slider-thumb"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

ColorPickerHue.displayName = "ColorPicker.Hue"

type ColorPickerAlphaProps = Omit<
  SliderPrimitive.Root.Props,
  "defaultValue" | "max" | "min" | "onValueChange" | "step" | "value"
>

function ColorPickerAlpha({ className, ...props }: ColorPickerAlphaProps) {
  const { l: lightness, c: chroma, h: hue, alpha, setColor } =
    useColorPicker()

  return (
    <SliderPrimitive.Root
      {...props}
      className={cn(sliderRootClassName, className)}
      max={100}
      step={1}
      value={alpha * 100}
      onValueChange={(nextValue) => {
        const value = Array.isArray(nextValue)
          ? (nextValue[0] ?? 100)
          : nextValue
        setColor({ alpha: value / 100 })
      }}
      thumbAlignment="edge"
      data-slot="color-picker-alpha"
    >
      <SliderPrimitive.Control
        className={sliderControlClassName}
        data-slot="color-picker-slider-control"
      >
        <SliderPrimitive.Track
          className={cn(
            sliderTrackClassName,
            "bg-[var(--hui-color-background-base-primary)]"
          )}
          style={{
            backgroundImage:
              "linear-gradient(45deg, var(--hui-color-border-base-primary) 25%, transparent 25%), linear-gradient(-45deg, var(--hui-color-border-base-primary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--hui-color-border-base-primary) 75%), linear-gradient(-45deg, transparent 75%, var(--hui-color-border-base-primary) 75%)",
            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
            backgroundSize: "12px 12px",
          }}
          data-slot="color-picker-slider-track"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[var(--hui-radius-3)]"
            style={{
              backgroundImage: `linear-gradient(90deg, transparent, ${formatOklch(
                { l: lightness, c: chroma, h: hue }
              )})`,
            }}
            data-slot="color-picker-alpha-gradient"
          />
          <SliderPrimitive.Indicator
            className={sliderIndicatorClassName}
            data-slot="color-picker-slider-range"
          />
          <SliderPrimitive.Thumb
            className={sliderThumbClassName}
            aria-label="Alpha"
            style={{
              backgroundColor: formatOklch({
                l: lightness,
                c: chroma,
                h: hue,
                alpha,
              }),
            }}
            data-slot="color-picker-slider-thumb"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

ColorPickerAlpha.displayName = "ColorPicker.Alpha"

type ColorPickerInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "readOnly" | "value"
> & {
  copyable?: boolean
}

function ColorPickerInput({
  copyable = false,
  className,
  ...props
}: ColorPickerInputProps) {
  const { l: lightness, c: chroma, h: hue, alpha, mode } = useColorPicker()
  const [copied, setCopied] = React.useState(false)
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const value = React.useMemo(
    () => getColorString({ l: lightness, c: chroma, h: hue, alpha }, mode),
    [alpha, chroma, hue, lightness, mode]
  )

  React.useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="relative flex min-w-0 flex-1" data-slot="color-picker-input-wrapper">
      <Input
        {...props}
        value={value}
        readOnly
        className={cn(
          copyable && "[&_[data-slot=input]]:pr-[var(--hui-space-9)]",
          className
        )}
        data-slot="color-picker-input"
      />
      {copyable && (
        <button
          type="button"
          aria-label={copied ? "Color copied" : "Copy color"}
          title={copied ? "Copied" : "Copy color"}
          onClick={copyValue}
          className="absolute top-1/2 right-[var(--hui-space-2)] inline-flex size-[var(--hui-space-6)] -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-1)] border-0 bg-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)]"
          data-slot="color-picker-copy"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-current">
              <path d="m5 12 4 4L19 6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-current">
              <rect x="8" y="8" width="11" height="11" rx="2" strokeWidth="1.5" />
              <path d="M16 8V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}
    </span>
  )
}

ColorPickerInput.displayName = "ColorPicker.Input"

type ColorPickerModeProps = React.ComponentProps<typeof Select.Trigger> & {
  options?: readonly ModeType[]
}

function ColorPickerMode({
  className,
  options = SUPPORTED_MODES,
  ...props
}: ColorPickerModeProps) {
  const { mode, setMode } = useColorPicker()

  return (
    <Select
      value={mode}
      onValueChange={(nextMode) => {
        if (nextMode && SUPPORTED_MODES.includes(nextMode as ModeType)) {
          setMode(nextMode as ModeType)
        }
      }}
    >
      <Select.Trigger
        {...props}
        className={cn("min-w-[var(--hui-space-15)] shrink-0", className)}
        data-slot="color-picker-mode"
      >
        <Select.Value>{mode.toUpperCase()}</Select.Value>
      </Select.Trigger>
      <Select.Content data-slot="color-picker-mode-content">
        {options.map((option) => (
          <Select.Item key={option} value={option}>
            {option.toUpperCase()}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

ColorPickerMode.displayName = "ColorPicker.Mode"

const ColorPicker = Object.assign(ColorPickerRoot, {
  Area: ColorPickerArea,
  Hue: ColorPickerHue,
  Alpha: ColorPickerAlpha,
  Input: ColorPickerInput,
  Mode: ColorPickerMode,
})

export {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerMode,
  ColorPickerRoot,
  SUPPORTED_MODES,
  formatColor,
  type ColorObject,
  type ColorPickerAlphaProps,
  type ColorPickerAreaProps,
  type ColorPickerHueProps,
  type ColorPickerInputProps,
  type ColorPickerModeProps,
  type ColorPickerProps,
  type ModeType,
}
