import { describe, expect, it } from "vitest"
import * as ERRORS from "@/src/utils/errors"
import { assertDryRunCanProceed } from "./add"

describe("assertDryRunCanProceed", () => {
  it("does not block a normal add command", () => {
    expect(() =>
      assertDryRunCanProceed(false, {
        [ERRORS.MISSING_CONFIG]: true,
      })
    ).not.toThrow()
  })

  it("stops a dry run before init could write components.json", () => {
    expect(() =>
      assertDryRunCanProceed(true, {
        [ERRORS.MISSING_CONFIG]: true,
      })
    ).toThrow("A dry run needs an existing components.json file")
  })

  it("stops a dry run before a project could be created", () => {
    expect(() =>
      assertDryRunCanProceed(true, {
        [ERRORS.MISSING_DIR_OR_EMPTY_PROJECT]: true,
      })
    ).toThrow("A dry run needs an existing project")
  })
})
