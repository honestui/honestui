import type {
  OnboardingChecklistLabels,
  OnboardingProgress,
  OnboardingStep,
} from "./onboarding-checklist-types"

export const defaultOnboardingChecklistLabels: OnboardingChecklistLabels = {
  progress: (done, total) => `${done} of ${total} done`,
  progressBar: "Setup progress",
  collapse: "Collapse setup guide",
  expand: "Expand setup guide",
  dismiss: "Dismiss setup guide",
  restore: (done, total) => `Setup guide · ${done} of ${total}`,
  optional: "Optional",
  markDone: (title) => `Mark “${title}” as done`,
  autoDone: "Done",
  autoPending: "Completes on its own when we see it happen",
  skip: "Skip",
  restoreStep: "Restore",
  skipped: (count) => `${count} skipped`,
  showSkipped: "Show",
  hideSkipped: "Hide",
  completeTitle: "You're all set",
  completeDescription: "Every step is done. You can dismiss this guide.",
  completeDismiss: "Dismiss guide",
}

/** Counts what is done, decides whether the guide is complete, and finds the next step. */
export function getOnboardingProgress(
  steps: readonly OnboardingStep[],
  completed: readonly string[],
  skipped: readonly string[] = []
): OnboardingProgress {
  const done = new Set(completed)
  const skip = new Set(skipped)
  const counted = steps.filter((step) => !skip.has(step.id))
  const next = counted.find((step) => !done.has(step.id))

  return {
    done: counted.filter((step) => done.has(step.id)).length,
    total: counted.length,
    complete: counted.every((step) => step.optional || done.has(step.id)),
    nextId: next?.id ?? null,
  }
}

/** Adds or removes an id, keeping the original order of the steps. */
export function toggleStepId(
  ids: readonly string[],
  id: string,
  include: boolean,
  steps?: readonly OnboardingStep[]
): string[] {
  const set = new Set(ids)
  if (include) set.add(id)
  else set.delete(id)
  if (!steps) return [...set]
  const order = new Map(steps.map((step, index) => [step.id, index]))
  return [...set].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity))
}
