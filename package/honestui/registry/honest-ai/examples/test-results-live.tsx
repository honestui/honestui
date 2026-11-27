"use client"

import * as React from "react"
import { RotateCcw as RotateCcwIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { TestResults, type TestStatus, type TestSuite } from "@/registry/honest-ai/ai/test-results"

// Sample plan: each test's final status and duration.
const plan: { suite: string; name: string; file: string; tests: [string, TestStatus, number][] }[] = [
  {
    suite: "auth",
    name: "Session tokens",
    file: "src/auth/session.test.ts",
    tests: [
      ["issues a token on sign-in", "passed", 14],
      ["refreshes before expiry", "passed", 22],
      ["rejects a revoked token", "passed", 9],
    ],
  },
  {
    suite: "rate",
    name: "Rate limiter",
    file: "src/auth/rate-limit.test.ts",
    tests: [
      ["allows 10 requests a minute", "passed", 31],
      ["resets the window", "passed", 18],
      ["shares limits across regions", "skipped", 0],
    ],
  },
]

function buildSuites(step: number): TestSuite[] {
  let index = 0
  return plan.map((suite) => ({
    id: suite.suite,
    name: suite.name,
    file: suite.file,
    tests: suite.tests.map(([name, status, duration]) => {
      const position = index++
      const done = position < step
      return {
        id: `${suite.suite}-${position}`,
        name,
        status: done ? status : position === step ? "running" : "queued",
        duration: done && status !== "skipped" ? duration : undefined,
      }
    }),
  }))
}

const total = plan.reduce((sum, suite) => sum + suite.tests.length, 0)

/** A run in progress. Nothing executes; a timer moves through the sample plan. */
export default function TestResultsLive() {
  const [step, setStep] = React.useState(0)
  const [run, setRun] = React.useState(0)

  React.useEffect(() => {
    if (step >= total) return
    const timer = window.setTimeout(() => setStep((current) => current + 1), 650)
    return () => window.clearTimeout(timer)
  }, [step, run])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <TestResults title="vitest run src/auth" suites={buildSuites(step)} defaultExpanded="all" />
      <div>
        <Button
          variant="ghost"
          size="sm"
          disabled={step < total}
          onClick={() => {
            setStep(0)
            setRun((current) => current + 1)
          }}
        >
          <RotateCcwIcon aria-hidden="true" />
          Replay
        </Button>
      </div>
    </div>
  )
}
