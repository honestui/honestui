export type OnboardingStepAction = {
  label: string
  /** A link. Rendered as an anchor. */
  href?: string | undefined
  onClick?: (() => void) | undefined
}

export type OnboardingStep = {
  id: string
  title: string
  description?: string | undefined
  /** The button that takes the person to do the step. */
  action?: OnboardingStepAction | undefined
  /** An optional step can be skipped, and the guide is complete without it. */
  optional?: boolean | undefined
  /**
   * `manual`: the person ticks the step off themselves.
   * `auto`: your application marks it done when it sees it happen, such as a
   * first deploy, and the person cannot tick it.
   */
  completion?: "manual" | "auto" | undefined
}

export type OnboardingProgress = {
  /** Steps done, among those not skipped. */
  done: number
  /** Steps not skipped. */
  total: number
  /** Every required step that is not skipped is done. */
  complete: boolean
  /** The first step that is neither done nor skipped, or `null`. */
  nextId: string | null
}

export type OnboardingChecklistLabels = {
  progress: (done: number, total: number) => string
  progressBar: string
  collapse: string
  expand: string
  dismiss: string
  restore: (done: number, total: number) => string
  optional: string
  markDone: (title: string) => string
  autoDone: string
  autoPending: string
  skip: string
  restoreStep: string
  skipped: (count: number) => string
  showSkipped: string
  hideSkipped: string
  completeTitle: string
  completeDescription: string
  completeDismiss: string
}
