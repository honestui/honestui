import { describe, expect, it } from "vitest"

import {
  getOnboardingProgress,
  toggleStepId,
} from "../../registry/default/product/onboarding-checklist/onboarding-checklist-utils"
import type { OnboardingStep } from "../../registry/default/product/onboarding-checklist/onboarding-checklist-types"

const steps: OnboardingStep[] = [
  { id: "a", title: "A" },
  { id: "b", title: "B" },
  { id: "c", title: "C", optional: true },
  { id: "d", title: "D", optional: true },
]

describe("getOnboardingProgress", () => {
  it("counts done steps among those not skipped", () => {
    expect(getOnboardingProgress(steps, ["a"])).toEqual({ done: 1, total: 4, complete: false, nextId: "b" })
    expect(getOnboardingProgress(steps, ["a"], ["c"])).toEqual({ done: 1, total: 3, complete: false, nextId: "b" })
  })

  it("is complete once every required step is done, without the optional ones", () => {
    expect(getOnboardingProgress(steps, ["a", "b"])).toMatchObject({ done: 2, total: 4, complete: true, nextId: "c" })
  })

  it("has no next step when everything is done or skipped", () => {
    expect(getOnboardingProgress(steps, ["a", "b", "c"], ["d"])).toEqual({
      done: 3,
      total: 3,
      complete: true,
      nextId: null,
    })
  })

  it("ignores ids that are not steps", () => {
    expect(getOnboardingProgress(steps, ["a", "zzz"]).done).toBe(1)
  })

  it("skips over a skipped step when choosing the next one", () => {
    expect(getOnboardingProgress(steps, ["a", "b"], ["c"]).nextId).toBe("d")
  })

  it("treats an empty guide as complete", () => {
    expect(getOnboardingProgress([], [])).toEqual({ done: 0, total: 0, complete: true, nextId: null })
  })
})

describe("toggleStepId", () => {
  it("adds and removes without duplicates", () => {
    expect(toggleStepId(["a"], "a", true)).toEqual(["a"])
    expect(toggleStepId(["a", "b"], "a", false)).toEqual(["b"])
  })

  it("keeps the steps' order when given the steps", () => {
    expect(toggleStepId(["c"], "a", true, steps)).toEqual(["a", "c"])
  })
})
