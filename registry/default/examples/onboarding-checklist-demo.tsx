"use client"

import * as React from "react"

import {
  OnboardingChecklist,
  type OnboardingStep,
} from "@/registry/default/product/onboarding-checklist/onboarding-checklist"

const steps: OnboardingStep[] = [
  {
    id: "profile",
    title: "Create your workspace",
    description: "Name it and pick a region for your data.",
  },
  {
    id: "invite",
    title: "Invite your team",
    description: "Teammates can review deploys and share environment variables.",
    action: { label: "Invite teammates" },
  },
  {
    id: "repo",
    title: "Connect a repository",
    description: "Every push to the main branch deploys to production. Other branches get a preview.",
    action: { label: "Connect GitHub" },
    completion: "auto",
  },
  {
    id: "domain",
    title: "Add a custom domain",
    description: "Point your domain at us and we will issue a certificate for it.",
    action: { label: "Add domain" },
    optional: true,
  },
  {
    id: "alerts",
    title: "Turn on deploy alerts",
    description: "Get a message in Slack or by email when a deploy fails.",
    action: { label: "Set up alerts" },
    optional: true,
  },
]

/**
 * Progress lives in this component's state here; in an app it lives with the
 * account. "Connect a repository" completes on its own: press its button to
 * simulate the app noticing a connected repository.
 */
export default function OnboardingChecklistDemo() {
  const [completed, setCompleted] = React.useState<string[]>(["profile"])
  const [skipped, setSkipped] = React.useState<string[]>([])
  const [dismissed, setDismissed] = React.useState(false)

  const withAutoStep = steps.map((step) =>
    step.id === "repo"
      ? {
          ...step,
          action: {
            label: "Connect GitHub",
            onClick: () => setCompleted((current) => [...new Set([...current, "repo"])]),
          },
        }
      : step
  )

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col">
      <OnboardingChecklist
        title="Get started with Northwind"
        description="A few steps to your first production deploy."
        steps={withAutoStep}
        completed={completed}
        onCompletedChange={setCompleted}
        skipped={skipped}
        onSkippedChange={setSkipped}
        dismissed={dismissed}
        onDismissedChange={setDismissed}
      />
    </div>
  )
}
