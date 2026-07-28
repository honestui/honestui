import type { PresetConfig } from "./preset"

export const DEFAULT_PRESETS = {
  default: {
    title: "Default",
    description: "Geist, balanced product UI",
    style: "default",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "honestui/icons",
    font: "geist",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false,
  },
  crisp: {
    title: "Crisp",
    description: "Inter, sharp SaaS UI",
    style: "crisp",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "honestui/icons",
    font: "inter",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false,
  },
  mono: {
    title: "Mono",
    description: "JetBrains Mono, technical UI",
    style: "mono",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "honestui/icons",
    font: "jetbrains-mono",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false,
  },
  editorial: {
    title: "Editorial",
    description: "Noto Sans + Playfair Display",
    style: "editorial",
    baseColor: "taupe",
    theme: "taupe",
    chartColor: "taupe",
    iconLibrary: "honestui/icons",
    font: "noto-sans",
    fontHeading: "playfair-display",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false,
  },
} satisfies Record<
  PresetConfig["style"],
  PresetConfig & {
    description: string
    rtl: boolean
    title: string
  }
>
