import { describe, expect, it } from "vitest"

import { addLatestTagToBareNpmPackage } from "./update-dependencies"

describe("addLatestTagToBareNpmPackage", () => {
  it("adds latest to bare unscoped package names", () => {
    expect(addLatestTagToBareNpmPackage("class-variance-authority")).toBe(
      "class-variance-authority@latest"
    )
  })

  it("adds latest to bare scoped package names", () => {
    expect(addLatestTagToBareNpmPackage("@base-ui-components/react")).toBe(
      "@base-ui-components/react@latest"
    )
  })

  it("keeps package specs that already include a version or tag", () => {
    expect(addLatestTagToBareNpmPackage("react@19.0.0")).toBe("react@19.0.0")
    expect(addLatestTagToBareNpmPackage("@scope/pkg@next")).toBe(
      "@scope/pkg@next"
    )
  })

  it("keeps aliases, local paths, and urls unchanged", () => {
    expect(addLatestTagToBareNpmPackage("ui@npm:@scope/ui@1.0.0")).toBe(
      "ui@npm:@scope/ui@1.0.0"
    )
    expect(addLatestTagToBareNpmPackage("file:../ui")).toBe("file:../ui")
    expect(addLatestTagToBareNpmPackage("https://example.com/ui.tgz")).toBe(
      "https://example.com/ui.tgz"
    )
  })
})
