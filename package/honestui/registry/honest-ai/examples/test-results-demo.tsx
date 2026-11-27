"use client"

import * as React from "react"

import { TestResults, type TestSuite } from "@/registry/honest-ai/ai/test-results"

// Sample results.
const sampleSuites: TestSuite[] = [
  {
    id: "invoice",
    name: "Invoice totals",
    file: "src/billing/invoice.test.ts",
    tests: [
      { id: "invoice-sum", name: "sums line items", status: "passed", duration: 4 },
      {
        id: "invoice-round",
        name: "rounds the total once, after tax",
        status: "failed",
        duration: 11,
        error: {
          message: "expect(received).toBe(expected)",
          expected: "1284.37",
          received: "1284.38",
          stack: "at Object.<anonymous> (src/billing/invoice.test.ts:42:31)",
        },
      },
      { id: "invoice-discount", name: "applies a percentage discount", status: "passed", duration: 3 },
      { id: "invoice-credit", name: "carries a credit note forward", status: "skipped" },
    ],
  },
  {
    id: "currency",
    name: "Currency formatting",
    file: "src/billing/currency.test.ts",
    tests: [
      { id: "currency-usd", name: "formats USD with two decimals", status: "passed", duration: 2 },
      { id: "currency-jpy", name: "formats JPY without decimals", status: "passed", duration: 2 },
      { id: "currency-negative", name: "puts the sign before the symbol", status: "passed", duration: 1 },
    ],
  },
  {
    id: "export",
    name: "CSV export",
    file: "src/billing/export.test.ts",
    tests: [
      { id: "export-header", name: "writes the header row", status: "passed", duration: 6 },
      { id: "export-escape", name: "quotes fields with commas", status: "passed", duration: 5 },
      { id: "export-large", name: "streams 50,000 rows", status: "passed", duration: 812 },
    ],
  },
]

/**
 * No runner is attached. Rerun failed waits a moment, then reports the
 * rounding test as fixed, as your runner would after the change lands.
 */
export default function TestResultsDemo() {
  const [suites, setSuites] = React.useState(sampleSuites)
  const [running, setRunning] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div className="w-full max-w-lg min-w-0">
      <TestResults
        title="vitest run src/billing"
        suites={suites}
        duration={1240}
        running={running}
        onRerunFailed={(ids) => {
          setRunning(true)
          setSuites((current) =>
            current.map((suite) => ({
              ...suite,
              tests: suite.tests.map((test) => (ids.includes(test.id) ? { ...test, status: "running" } : test)),
            }))
          )
          timer.current = window.setTimeout(() => {
            setRunning(false)
            setSuites((current) =>
              current.map((suite) => ({
                ...suite,
                tests: suite.tests.map((test) =>
                  ids.includes(test.id) ? { ...test, status: "passed", duration: 9, error: undefined } : test
                ),
              }))
            )
          }, 1400)
        }}
      />
    </div>
  )
}
