"use client"

import "@/package/honestui/src/density.css"

import { useTheme } from "next-themes"
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

const noop = () => () => {}

/** True after hydration, without a setState-in-effect round trip. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false)
}

export const ACCENTS = [
  { value: "indigo", label: "Indigo", swatch: "oklch(0.5438 0.191 267.01)" },
  { value: "orange", label: "Orange", swatch: "oklch(0.6908 0.1909 45.02)" },
  { value: "mint", label: "Mint", swatch: "oklch(0.8696 0.0999 177.98)" },
] as const

export const GRAYS = [
  { value: "gray", label: "Gray" },
  { value: "mauve", label: "Mauve" },
  { value: "slate", label: "Slate" },
  { value: "sage", label: "Sage" },
] as const

export const DENSITIES = ["compact", "default", "comfortable"] as const

const RADII = [6, 10, 12, 16, 20, 28]

export type ThemeState = {
  accent: (typeof ACCENTS)[number]["value"]
  gray: (typeof GRAYS)[number]["value"]
  radius: number
  density: (typeof DENSITIES)[number]
}

const DEFAULT_STATE: ThemeState = {
  accent: "indigo",
  gray: "gray",
  radius: 1,
  density: "default",
}

type ThemeScopeContext = {
  state: ThemeState
  set: (patch: Partial<ThemeState>) => void
  reset: () => void
  isDefault: boolean
}

const Context = createContext<ThemeScopeContext | null>(null)

export function useThemeScope() {
  const value = useContext(Context)
  if (!value) throw new Error("useThemeScope must be used inside <ThemeScope>")
  return value
}

/**
 * Re-declares the Honest UI token layer on a wrapper so the whole landing page
 * can be rethemed live. The semantic color tokens are defined on [data-theme],
 * so the wrapper repeats the resolved theme to make them resolve against the
 * accent and gray chosen here.
 */
export function ThemeScope({ children, className }: { children: ReactNode; className?: string }) {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()
  const [state, setState] = useState<ThemeState>(DEFAULT_STATE)

  const value = useMemo<ThemeScopeContext>(
    () => ({
      state,
      set: (patch) => setState((prev) => ({ ...prev, ...patch })),
      reset: () => setState(DEFAULT_STATE),
      isDefault:
        state.accent === DEFAULT_STATE.accent &&
        state.gray === DEFAULT_STATE.gray &&
        state.radius === DEFAULT_STATE.radius &&
        state.density === DEFAULT_STATE.density,
    }),
    [state],
  )

  const style = useMemo(() => {
    const vars: Record<string, string> = {}
    RADII.forEach((r, i) => {
      vars[`--hui-radius-${i + 1}`] = `${Math.round(r * state.radius * 10) / 10}px`
    })
    return vars as React.CSSProperties
  }, [state.radius])

  return (
    <Context.Provider value={value}>
      <div
        className={className}
        data-accent-color={state.accent === "indigo" ? undefined : state.accent}
        data-density={state.density}
        data-gray-color={state.gray === "gray" ? undefined : state.gray}
        data-theme={mounted ? resolvedTheme : undefined}
        style={style}
      >
        {children}
      </div>
    </Context.Provider>
  )
}
