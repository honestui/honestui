import path from "node:path"
import { describe, expect, it } from "vitest"
import { resolveRegistryOutputPath } from "./output-path"

describe("resolveRegistryOutputPath", () => {
  it("resolves a registry item inside the output directory", () => {
    expect(resolveRegistryOutputPath("/tmp/registry", "button")).toBe(
      path.resolve("/tmp/registry/button.json")
    )
  })

  it.each(["../outside", "../../outside", "/absolute/path"])(
    "rejects a path traversal name: %s",
    (name) => {
      expect(() => resolveRegistryOutputPath("/tmp/registry", name)).toThrow(
        "outside the output directory"
      )
    }
  )
})
