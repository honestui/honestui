import { describe, expect, it } from "vitest"
import { deepmerge, mergeWithArrayReplacement } from "./deepmerge"

describe("configuration merging", () => {
  it("merges nested settings and concatenates arrays without changing inputs", () => {
    const base = { theme: { colors: { primary: "blue" }, fonts: ["sans"] } }
    const override = { theme: { colors: { accent: "red" }, fonts: ["mono"] } }
    const result = deepmerge(base, override)
    expect(result).toEqual({
      theme: { colors: { primary: "blue", accent: "red" }, fonts: ["sans", "mono"] },
    })
    result.theme.fonts.push("serif")
    expect(base.theme.fonts).toEqual(["sans"])
    expect(override.theme.fonts).toEqual(["mono"])
  })

  it("replaces Tailwind arrays while retaining other theme settings", () => {
    expect(mergeWithArrayReplacement(
      { theme: { fonts: ["sans"], color: "blue" } },
      { theme: { fonts: ["mono"] } },
    )).toEqual({ theme: { fonts: ["mono"], color: "blue" } })
  })

  it.each([deepmerge, mergeWithArrayReplacement])("rejects prototype poisoning at every depth", (merge) => {
    const malicious = JSON.parse('{"__proto__":{"polluted":true},"nested":{"__proto__":{"polluted":true}},"constructor":{"prototype":{"polluted":true}}}')
    const result = merge({}, malicious)
    expect(result.polluted).toBeUndefined()
    expect(result.nested.polluted).toBeUndefined()
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.getPrototypeOf(result.nested)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
