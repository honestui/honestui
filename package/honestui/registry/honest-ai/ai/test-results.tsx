"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  CircleDashed as CircleDashedIcon,
  CircleMinus as CircleMinusIcon,
  LoaderCircle as LoaderCircleIcon,
  RotateCcw as RotateCcwIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/registry/default/ui/collapsible"

export type TestStatus = "passed" | "failed" | "skipped" | "running" | "queued"

export type TestError = {
  /** The assertion message, such as "expected 3 to equal 4". */
  message: string
  /** Optional expected and received values, shown as a two-line diff. */
  expected?: string
  received?: string
  /** A few lines of stack or source, shown as they are. */
  stack?: string
}

export type TestCase = {
  id: string
  name: string
  status: TestStatus
  /** Milliseconds. */
  duration?: number
  error?: TestError
}

export type TestSuite = {
  id: string
  name: string
  /** The file the suite lives in, shown after the name. */
  file?: string
  tests: TestCase[]
}

export type TestResultsLabels = {
  title: string
  passed: string
  failed: string
  skipped: string
  running: string
  queued: string
  rerunFailed: string
  rerunning: string
  expected: string
  received: string
  noTests: string
  /** How a duration in milliseconds reads. */
  formatDuration: (ms: number) => string
}

export const defaultTestResultsLabels: TestResultsLabels = {
  title: "Test results",
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
  running: "running",
  queued: "queued",
  rerunFailed: "Rerun failed",
  rerunning: "Rerunning",
  expected: "Expected",
  received: "Received",
  noTests: "No tests were collected.",
  formatDuration: (ms) =>
    ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`,
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)]"

const statusIcon: Record<TestStatus, { Icon: typeof CircleCheckIcon; className: string }> = {
  // Passing is quiet; color is kept for the tests that need attention.
  passed: { Icon: CircleCheckIcon, className: "text-[var(--hui-color-foreground-base-secondary)]" },
  failed: { Icon: CircleAlertIcon, className: "text-[var(--hui-color-foreground-danger-primary)]" },
  skipped: { Icon: CircleMinusIcon, className: "text-[var(--hui-color-foreground-base-tertiary)]" },
  running: {
    Icon: LoaderCircleIcon,
    className: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  },
  queued: { Icon: CircleDashedIcon, className: "text-[var(--hui-color-foreground-base-tertiary)]" },
}

type Counts = Record<TestStatus, number>

function countTests(tests: TestCase[]): Counts {
  const counts: Counts = { passed: 0, failed: 0, skipped: 0, running: 0, queued: 0 }
  for (const test of tests) counts[test.status] += 1
  return counts
}

function sumDuration(tests: TestCase[]) {
  return tests.reduce((total, test) => total + (test.duration ?? 0), 0)
}

function countsText(counts: Counts, labels: TestResultsLabels) {
  const order: TestStatus[] = ["failed", "passed", "skipped", "running", "queued"]
  return order
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${labels[status]}`)
}

export type TestResultsProps = Omit<React.ComponentProps<"section">, "children" | "title"> & {
  suites: TestSuite[]
  /** A heading for the run, such as the command or the package name. */
  title?: React.ReactNode
  /** Total wall time in milliseconds. Defaults to the sum of the tests. */
  duration?: number
  /** True while a rerun is in progress. Disables Rerun failed. */
  running?: boolean
  /** Passing it shows Rerun failed whenever a test has failed. */
  onRerunFailed?: (failedTestIds: string[]) => void
  /** Which suites start open. "failed" opens a suite when one of its tests fails. */
  defaultExpanded?: "failed" | "all" | "none"
  labels?: Partial<TestResultsLabels>
}

/**
 * A test run: a summary of passed, failed, and skipped tests, then each suite
 * with its tests. It shows the results you pass; update them as your runner
 * reports.
 */
function TestResults({
  suites,
  title,
  duration,
  running = false,
  onRerunFailed,
  defaultExpanded = "failed",
  labels: labelsProp,
  className,
  ...props
}: TestResultsProps) {
  const labels = React.useMemo(
    () => ({ ...defaultTestResultsLabels, ...labelsProp }),
    [labelsProp]
  )
  const titleId = React.useId()
  const allTests = React.useMemo(() => suites.flatMap((suite) => suite.tests), [suites])
  const counts = countTests(allTests)
  const total = allTests.length
  const failedIds = allTests.filter((test) => test.status === "failed").map((test) => test.id)
  const totalDuration = duration ?? sumDuration(allTests)
  const showRerun = onRerunFailed !== undefined && (failedIds.length > 0 || running)

  const segments: { status: TestStatus; className: string }[] = [
    { status: "passed", className: "bg-[var(--hui-color-foreground-base-secondary)]" },
    { status: "failed", className: "bg-[var(--hui-color-foreground-danger-primary)]" },
    { status: "skipped", className: "bg-[var(--hui-color-border-base-primary)]" },
    { status: "running", className: "bg-[var(--hui-color-border-base-secondary)]" },
    { status: "queued", className: "bg-[var(--hui-color-border-base-secondary)]" },
  ]

  return (
    <section
      aria-labelledby={titleId}
      data-slot="test-results"
      data-running={running || undefined}
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        rowText,
        className
      )}
      {...props}
    >
      <header
        data-slot="test-results-summary"
        className="flex min-w-0 flex-col gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-5)]"
      >
        <div className="flex min-w-0 items-center gap-[var(--hui-space-4)]">
          <div className="min-w-0 flex-1">
            <p
              id={titleId}
              className={cn("m-0 truncate [font-weight:var(--hui-font-weight-medium)]", rowText)}
            >
              {title ?? labels.title}
            </p>
            {/* Polite, so a finished rerun is heard without moving focus. */}
            <p
              aria-live="polite"
              data-slot="test-results-counts"
              className={cn("m-0 truncate text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}
            >
              {total === 0
                ? labels.noTests
                : [...countsText(counts, labels), labels.formatDuration(totalDuration)].join(" · ")}
            </p>
          </div>
          {showRerun && (
            <Button
              variant="secondary"
              size="xs"
              disabled={running}
              data-slot="test-results-rerun"
              onClick={() => onRerunFailed?.(failedIds)}
              className="shrink-0"
            >
              {running ? (
                <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
              ) : (
                <RotateCcwIcon aria-hidden="true" />
              )}
              {running ? labels.rerunning : labels.rerunFailed}
            </Button>
          )}
        </div>
        {total > 0 && (
          // The words above carry the numbers; the bar is their shape.
          <div
            aria-hidden="true"
            data-slot="test-results-bar"
            className="flex h-1 w-full gap-px overflow-hidden rounded-full bg-[var(--hui-color-border-base-secondary)]"
          >
            {segments
              .filter((segment) => counts[segment.status] > 0)
              .map((segment) => (
                <span
                  key={segment.status}
                  data-status={segment.status}
                  className={cn("h-full motion-safe:[transition:flex-grow_var(--hui-duration-normal)_var(--hui-ease-out)]", segment.className)}
                  style={{ flexGrow: counts[segment.status], flexBasis: 0 }}
                />
              ))}
          </div>
        )}
      </header>

      <ul role="list" className="m-0 flex list-none flex-col p-0">
        {suites.map((suite) => (
          <SuiteRow key={suite.id} suite={suite} labels={labels} expand={defaultExpanded} />
        ))}
      </ul>
    </section>
  )
}

function SuiteRow({
  suite,
  labels,
  expand,
}: {
  suite: TestSuite
  labels: TestResultsLabels
  expand: "failed" | "all" | "none"
}) {
  const counts = countTests(suite.tests)
  const suiteStatus: TestStatus =
    counts.failed > 0
      ? "failed"
      : counts.running > 0
        ? "running"
        : counts.queued > 0
          ? "queued"
          : counts.passed > 0
            ? "passed"
            : "skipped"
  const { Icon, className: iconClassName } = statusIcon[suiteStatus]
  // Failures open on their own; a passing suite waits to be asked.
  const opensOnFailure = expand === "failed"
  const [open, setOpen] = React.useState(expand === "all" || (opensOnFailure && counts.failed > 0))
  const hadFailure = React.useRef(counts.failed > 0)
  React.useEffect(() => {
    if (opensOnFailure && counts.failed > 0 && !hadFailure.current) setOpen(true)
    hadFailure.current = counts.failed > 0
  }, [counts.failed, opensOnFailure])

  return (
    <li
      data-slot="test-suite"
      data-status={suiteStatus}
      className="min-w-0 border-b-[0.5px] border-[var(--hui-color-border-base-primary)] last:border-b-0"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            "group/suite flex min-h-[var(--hui-space-11)] w-full min-w-0 items-center gap-[var(--hui-space-4)] rounded-none border-0 bg-transparent px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-left text-[var(--hui-color-foreground-base-primary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
            rowText
          )}
        >
          <Icon strokeWidth={1.5} aria-hidden="true" className={cn("size-4 shrink-0", iconClassName)} />
          <span className="flex min-w-0 flex-1 items-baseline gap-[var(--hui-space-3)]">
            {/* The name keeps its width; the file path gives way first. */}
            <span className="max-w-full shrink-0 truncate [font-weight:var(--hui-font-weight-medium)]" title={suite.name}>
              {suite.name}
            </span>
            {suite.file && (
              <span
                className={cn(
                  "hidden min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)] sm:inline",
                  monoText
                )}
              >
                {suite.file}
              </span>
            )}
          </span>
          <span className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}>
            {countsText(counts, labels).join(" · ")}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/suite:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ul
            role="list"
            className="m-0 flex list-none flex-col p-0 pb-[var(--hui-space-3)]"
          >
            {suite.tests.map((test) => (
              <TestRow key={test.id} test={test} labels={labels} />
            ))}
          </ul>
        </CollapsiblePanel>
      </Collapsible>
    </li>
  )
}

function TestRow({ test, labels }: { test: TestCase; labels: TestResultsLabels }) {
  const { Icon, className: iconClassName } = statusIcon[test.status]

  return (
    <li data-slot="test-case" data-status={test.status} className="min-w-0">
      <div className="flex min-w-0 items-center gap-[var(--hui-space-4)] py-[var(--hui-space-2)] ps-[calc(var(--hui-space-5)+var(--hui-space-6))] pe-[calc(var(--hui-space-5)+14px+var(--hui-space-4))]">
        <Icon strokeWidth={1.5} aria-hidden="true" className={cn("size-3.5 shrink-0", iconClassName)} />
        <span
          title={test.name}
          className={cn(
            "min-w-0 flex-1 truncate",
            test.status === "skipped"
              ? "text-[var(--hui-color-foreground-base-secondary)]"
              : "text-[var(--hui-color-foreground-base-primary)]"
          )}
        >
          {test.name}
        </span>
        {/* Status in words for readers that skip the icon. */}
        <span className="sr-only">{labels[test.status]}</span>
        {test.duration !== undefined && (
          <span className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}>
            {labels.formatDuration(test.duration)}
          </span>
        )}
      </div>
      {test.status === "failed" && test.error && <ErrorBlock error={test.error} labels={labels} />}
    </li>
  )
}

function ErrorBlock({ error, labels }: { error: TestError; labels: TestResultsLabels }) {
  const hasDiff = error.expected !== undefined || error.received !== undefined

  return (
    <div
      data-slot="test-error"
      className={cn(
        "ms-[calc(var(--hui-space-5)+var(--hui-space-6)+14px+var(--hui-space-4))] me-[var(--hui-space-5)] mt-[var(--hui-space-1)] mb-[var(--hui-space-3)] overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]",
        monoText
      )}
    >
      <p className="m-0 px-[var(--hui-space-4)] py-[var(--hui-space-3)] break-words whitespace-pre-wrap text-[var(--hui-color-foreground-danger-primary)]">
        {error.message}
      </p>
      {hasDiff && (
        <dl className="m-0 border-t-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)]">
          {error.expected !== undefined && (
            <DiffLine sign="-" term={labels.expected} value={error.expected} kind="expected" />
          )}
          {error.received !== undefined && (
            <DiffLine sign="+" term={labels.received} value={error.received} kind="received" />
          )}
        </dl>
      )}
      {error.stack && (
        <pre className="m-0 overflow-x-auto border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]">
          {error.stack}
        </pre>
      )}
    </div>
  )
}

function DiffLine({
  sign,
  term,
  value,
  kind,
}: {
  sign: string
  term: string
  value: string
  kind: "expected" | "received"
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-[var(--hui-space-3)] px-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)]",
        kind === "expected"
          ? "bg-[color-mix(in_oklch,var(--hui-color-background-success-primary)_50%,transparent)]"
          : "bg-[color-mix(in_oklch,var(--hui-color-background-danger-primary)_50%,transparent)]"
      )}
    >
      <span aria-hidden="true" className="w-2 shrink-0 select-none text-[var(--hui-color-foreground-base-secondary)]">
        {sign}
      </span>
      <dt className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">{term}</dt>
      <dd className="m-0 min-w-0 break-all whitespace-pre-wrap">{value}</dd>
    </div>
  )
}

export { TestResults }
