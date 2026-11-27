"use client"

import * as React from "react"

import {
  OnboardingChecklist,
  type OnboardingStep,
} from "@/registry/default/product/onboarding-checklist/onboarding-checklist"

const steps: OnboardingStep[] = [
  { id: "account", title: "Verify your email" },
  { id: "bank", title: "Link a bank account", completion: "auto" },
  { id: "invoice", title: "Send your first invoice" },
  {
    id: "reminders",
    title: "Schedule payment reminders",
    description: "Reminders go out three days before and after an invoice is due.",
    action: { label: "Set reminders" },
    optional: true,
  },
]

/**
 * One manual step left. Tick it to see the finished state; the optional step
 * is not needed for the guide to be complete. Dismiss leaves a small button to
 * bring the guide back.
 */
export default function OnboardingChecklistComplete() {
  const [completed, setCompleted] = React.useState<string[]>(["account", "bank"])
  const [skipped, setSkipped] = React.useState<string[]>(["reminders"])
  const [dismissed, setDismissed] = React.useState(false)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col">
      <OnboardingChecklist
        title="Set up invoicing"
        steps={steps}
        completed={completed}
        onCompletedChange={setCompleted}
        skipped={skipped}
        onSkippedChange={setSkipped}
        dismissed={dismissed}
        onDismissedChange={setDismissed}
        labels={{ completeDescription: "Invoices can go out. You can dismiss this guide." }}
      />
    </div>
  )
}
