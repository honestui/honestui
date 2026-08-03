import { describe, expect, it } from "vitest"

import { DEPRECATED_COMPONENTS } from "./constants"

describe("DEPRECATED_COMPONENTS", () => {
  it("keeps the supported toast component installable", () => {
    expect(DEPRECATED_COMPONENTS.some((component) => component.name === "toast"))
      .toBe(false)
  })
})
