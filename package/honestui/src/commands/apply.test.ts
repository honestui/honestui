import { REGISTRY_URL } from "@/src/registry/constants"
import { describe, expect, it } from "vitest"

import {
  getPresetUrlOnly,
  parseApplyOnlyParts,
  resolveApplyInitUrl,
  resolveApplyOnly,
  validateApplyOnlyPreset,
} from "./apply"

const HONESTUI_URL = REGISTRY_URL.replace(/\/r\/?$/, "")

describe("resolveApplyInitUrl", () => {
  it("should include the inferred template for preset codes", () => {
    const initUrl = resolveApplyInitUrl("a0", "base", {
      template: "next",
      rtl: true,
    })
    const parsed = new URL(initUrl)

    expect(parsed.origin + parsed.pathname).toBe(`${HONESTUI_URL}/init`)
    expect(parsed.searchParams.get("template")).toBe("next")
    expect(parsed.searchParams.get("preset")).toBe("a0")
    expect(parsed.searchParams.get("base")).toBe("base")
    expect(parsed.searchParams.get("rtl")).toBe("true")
  })

  it("should include the inferred template for named presets", () => {
    const initUrl = resolveApplyInitUrl("mono", "base", {
      template: "next",
      rtl: true,
    })
    const parsed = new URL(initUrl)

    expect(parsed.origin + parsed.pathname).toBe(`${HONESTUI_URL}/init`)
    expect(parsed.searchParams.get("template")).toBe("next")
    expect(parsed.searchParams.get("base")).toBe("base")
    expect(parsed.searchParams.get("rtl")).toBe("true")
  })

  it("should keep the current base for raw preset URLs without injecting a template", () => {
    const presetUrl = `${HONESTUI_URL}/init?base=radix&style=default&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=inter&rtl=false&menuAccent=subtle&menuColor=default&radius=default`
    const initUrl = resolveApplyInitUrl(presetUrl, "base", {
      template: "next",
      rtl: true,
    })
    const parsed = new URL(initUrl)

    expect(parsed.searchParams.get("template")).toBeNull()
    expect(parsed.searchParams.get("track")).toBe("1")
    expect(parsed.searchParams.get("base")).toBe("base")
    expect(parsed.searchParams.get("rtl")).toBe("true")
  })

  it("should include only for preset codes", () => {
    const initUrl = resolveApplyInitUrl("a0", "base", {
      template: "next",
      rtl: true,
      only: "theme,font",
    })
    const parsed = new URL(initUrl)

    expect(parsed.searchParams.get("only")).toBe("theme,font")
  })

  it("should include only for named presets", () => {
    const initUrl = resolveApplyInitUrl("mono", "base", {
      template: "next",
      rtl: true,
      only: "font",
    })
    const parsed = new URL(initUrl)

    expect(parsed.searchParams.get("only")).toBe("font")
  })

  it("should include only for raw preset URLs", () => {
    const presetUrl = `${HONESTUI_URL}/init?base=radix&style=default&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=inter&rtl=false&menuAccent=subtle&menuColor=default&radius=default`
    const initUrl = resolveApplyInitUrl(presetUrl, "base", {
      template: "next",
      rtl: true,
      only: "theme",
    })
    const parsed = new URL(initUrl)

    expect(parsed.searchParams.get("only")).toBe("theme")
  })

  it("should preserve only from raw preset URLs", () => {
    const presetUrl = `${HONESTUI_URL}/init?base=radix&style=default&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=inter&rtl=false&menuAccent=subtle&menuColor=default&radius=default&only=font`
    const initUrl = resolveApplyInitUrl(presetUrl, "base", {
      template: "next",
      rtl: true,
    })
    const parsed = new URL(initUrl)

    expect(parsed.searchParams.get("only")).toBe("font")
  })
})

describe("parseApplyOnlyParts", () => {
  it("returns undefined when only is omitted", () => {
    expect(resolveApplyOnly(undefined)).toBeUndefined()
  })

  it("rejects missing only values with allowed values", () => {
    expect(() => resolveApplyOnly(true)).toThrow(
      [
        "Missing value for --only.",
        "Use one or more of: theme, font.",
        "Example: honestui apply <preset> --only theme,font.",
      ].join("\n")
    )
  })

  it("normalizes explicit values and aliases", () => {
    expect(resolveApplyOnly("font")).toEqual(["font"])
    expect(parseApplyOnlyParts("theme,font")).toEqual(["theme", "font"])
  })

  it("dedupes and accepts plural aliases", () => {
    expect(parseApplyOnlyParts("theme,fonts,font")).toEqual(["theme", "font"])
  })

  it("rejects invalid values", () => {
    expect(() => parseApplyOnlyParts("theme,colors")).toThrow(
      [
        "Invalid value for --only: theme,colors.",
        "Use one or more of: theme, font.",
        "Example: honestui apply <preset> --only theme,font.",
      ].join("\n")
    )
    expect(() => parseApplyOnlyParts("")).toThrow("Invalid value for --only")
    expect(() => parseApplyOnlyParts("icon")).toThrow(
      "Use one or more of: theme, font."
    )
  })
})

describe("getPresetUrlOnly", () => {
  it("reads only from honestui init URLs", () => {
    const presetUrl = `${HONESTUI_URL}/init?base=radix&style=default&only=font`

    expect(getPresetUrlOnly(presetUrl)).toBe("font")
  })

  it("reads only from non-honestui init URLs", () => {
    const presetUrl =
      "http://localhost:4000/init?base=radix&style=default&only=font"

    expect(getPresetUrlOnly(presetUrl)).toBe("font")
    expect(resolveApplyOnly(getPresetUrlOnly(presetUrl))).toEqual(["font"])
  })

  it("ignores only on non-init URLs", () => {
    const presetUrl =
      "http://localhost:4000/r/styles/default/button.json?only=font"

    expect(getPresetUrlOnly(presetUrl)).toBeUndefined()
  })
})

describe("validateApplyOnlyPreset", () => {
  it("rejects only without a preset", () => {
    expect(() => validateApplyOnlyPreset({ only: ["theme"] })).toThrow(
      [
        "Missing preset for --only.",
        "Use: honestui apply <preset> --only theme,font.",
      ].join("\n")
    )
  })

  it("allows only with a preset", () => {
    expect(() =>
      validateApplyOnlyPreset({ preset: "a0", only: ["theme"] })
    ).not.toThrow()
  })
})
