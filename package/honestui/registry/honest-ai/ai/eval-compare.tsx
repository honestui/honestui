"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CircleX as CircleXIcon,
  Diff as DiffIcon,
  Equal as EqualIcon,
  ThumbsUp as ThumbsUpIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Toggle } from "@/registry/default/ui/toggle"

/* -------------------------------------------------------------------------------------------------
 * Word diff
 * -----------------------------------------------------------------------------------------------*/

export type WordDiffPart = {
  type: "equal" | "added" | "removed"
  /** The words, with the spaces that followed them. */
  text: string
}

// Above this many word pairs the table gets large, so the diff falls back to
// "everything changed" instead of blocking the main thread.
const MAX_DIFF_CELLS = 250_000

function tokenize(text: string) {
  // Each token is a word plus the whitespace after it, so joining tokens
  // gives back the original text.
  return text.match(/\S+\s*|\s+/g) ?? []
}

/**
 * Compares two texts word by word with a longest-common-subsequence table.
 * Words match when they are equal apart from the whitespace after them.
 * Consecutive parts of the same type are merged.
 */
export function diffWords(before: string, after: string): WordDiffPart[] {
  const a = tokenize(before)
  const b = tokenize(after)
  const parts: WordDiffPart[] = []

  const push = (type: WordDiffPart["type"], text: string) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.text += text
    else parts.push({ type, text })
  }

  if (a.length * b.length > MAX_DIFF_CELLS) {
    if (before) push("removed", before)
    if (after) push("added", after)
    return parts
  }

  const key = (token: string) => token.trimEnd()
  // lengths[i][j] is the LCS length of a[i..] and b[j..].
  const lengths: Uint32Array[] = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i][j] =
        key(a[i]) === key(b[j])
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (key(a[i]) === key(b[j])) {
      // Keep the new text's spacing.
      push("equal", b[j])
      i += 1
      j += 1
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push("removed", a[i])
      i += 1
    } else {
      push("added", b[j])
      j += 1
    }
  }
  while (i < a.length) push("removed", a[i++])
  while (j < b.length) push("added", b[j++])

  return parts
}

function countWords(parts: WordDiffPart[], type: WordDiffPart["type"]) {
  return parts.reduce((total, part) => (part.type === type ? total + tokenize(part.text.trim()).length : total), 0)
}

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export type EvalMetric = {
  key: string
  label: string
  /** Which direction wins. Without it the row has no best value. */
  better?: "higher" | "lower"
  /** Formats a value for display, such as `(v) => \`${v} ms\``. */
  format?: (value: number) => string
}

export type EvalAssertion = {
  label: string
  passed: boolean
  /** Why it failed, or what was checked. */
  detail?: string
}

export type EvalCandidate = {
  id: string
  /** The model or prompt version, such as "gpt-5-mini". */
  label: string
  /** A short note under the label, such as "Prompt v3 · temperature 0.2". */
  meta?: string
  /** The output as plain text. Line breaks are kept. */
  output: string
  /** A value for each metric `key`. `null` or a missing key shows as no value. */
  metrics?: Record<string, number | null | undefined>
  assertions?: EvalAssertion[]
}

export type EvalVote = string | "tie" | null

export type EvalCompareLabels = {
  /** Names the comparison region. */
  region: string
  prompt: string
  expected: string
  /** The Toggle that turns the word diff on. */
  showDiff: string
  baseline: string
  /** The button that makes a column the baseline. */
  useAsBaseline: (label: string) => string
  /** The count under each compared column, such as "12 words added, 4 removed". */
  diffSummary: (added: number, removed: number) => string
  added: string
  removed: string
  scorecard: string
  metric: string
  best: string
  noValue: string
  checks: (passed: number, total: number) => string
  passed: string
  failed: string
  /** The vote button's visible text; the candidate's label follows it for screen readers. */
  preferButton: string
  tie: string
  /** Announced when a vote is cast. */
  voted: (label: string | null) => string
  previousCase: string
  nextCase: string
  caseCount: (index: number, count: number) => string
}

export const defaultEvalCompareLabels: EvalCompareLabels = {
  region: "Comparison",
  prompt: "Prompt",
  expected: "Expected",
  showDiff: "Differences",
  baseline: "Baseline",
  useAsBaseline: (label) => `Compare against ${label}`,
  diffSummary: (added, removed) =>
    added === 0 && removed === 0 ? "Same words as the baseline" : `${added} words added, ${removed} removed`,
  added: "Added",
  removed: "Removed",
  scorecard: "Scorecard",
  metric: "Metric",
  best: "Best",
  noValue: "No value",
  checks: (passed, total) => `${passed} of ${total} checks passed`,
  passed: "Passed",
  failed: "Failed",
  preferButton: "Prefer",
  tie: "Tie",
  voted: (label) => (label ? `Preferred ${label}.` : "Marked as a tie."),
  previousCase: "Previous case",
  nextCase: "Next case",
  caseCount: (index, count) => `Case ${index + 1} of ${count}`,
}

export type EvalCompareProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The input every candidate answered. */
  prompt?: React.ReactNode
  /** A reference answer, shown under the prompt. */
  expected?: React.ReactNode
  /** Two to four outputs, in column order. */
  candidates: EvalCandidate[]
  /** The rows of the scorecard. Without it, no scorecard is shown. */
  metrics?: EvalMetric[]
  /** Whether the word diff is shown. */
  diff?: boolean
  defaultDiff?: boolean
  onDiffChange?: (diff: boolean) => void
  /** The candidate the others are compared against. Defaults to the first. */
  baselineId?: string
  defaultBaselineId?: string
  onBaselineChange?: (id: string) => void
  /** The current preference: a candidate `id`, `"tie"`, or `null`. Passing `onVote` shows the vote. */
  vote?: EvalVote
  onVote?: (vote: EvalVote) => void
  /** With `caseCount` and `onCaseChange`, shows the case switcher. Zero-based. */
  caseIndex?: number
  caseCount?: number
  onCaseChange?: (index: number) => void
  /** Draws an output, for example as Markdown, while the diff is off. */
  renderOutput?: (candidate: EvalCandidate) => React.ReactNode
  labels?: Partial<EvalCompareLabels>
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const secondary = "text-[var(--hui-color-foreground-base-secondary)]"
const hairline = "border-[var(--hui-color-border-base-primary)]"

function formatMetric(metric: EvalMetric, value: number) {
  if (metric.format) return metric.format(value)
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

/** The ids holding the best value in a metric row, or none when the row has no winner. */
function bestIds(metric: EvalMetric, candidates: EvalCandidate[]) {
  if (!metric.better) return new Set<string>()
  const values = candidates
    .map((candidate) => ({ id: candidate.id, value: candidate.metrics?.[metric.key] }))
    .filter((entry): entry is { id: string; value: number } => typeof entry.value === "number" && Number.isFinite(entry.value))
  if (values.length < 2) return new Set<string>()
  const target =
    metric.better === "higher"
      ? Math.max(...values.map((entry) => entry.value))
      : Math.min(...values.map((entry) => entry.value))
  const winners = values.filter((entry) => entry.value === target)
  // Everyone tied is no winner.
  if (winners.length === values.length) return new Set<string>()
  return new Set(winners.map((entry) => entry.id))
}

/**
 * The same prompt's outputs from several models or prompt versions, side by
 * side, with an optional word diff against a baseline, a scorecard, and a
 * preference vote. It shows the results you pass; running the eval is your
 * application's work.
 */
function EvalCompare({
  prompt,
  expected,
  candidates,
  metrics,
  diff: diffProp,
  defaultDiff = false,
  onDiffChange,
  baselineId: baselineProp,
  defaultBaselineId,
  onBaselineChange,
  vote,
  onVote,
  caseIndex,
  caseCount,
  onCaseChange,
  renderOutput,
  labels: labelsProp,
  className,
  ...props
}: EvalCompareProps) {
  const labels = { ...defaultEvalCompareLabels, ...labelsProp }
  const regionId = React.useId()

  const [diffState, setDiffState] = React.useState(defaultDiff)
  const diff = diffProp ?? diffState
  const setDiff = (next: boolean) => {
    if (diffProp === undefined) setDiffState(next)
    onDiffChange?.(next)
  }

  const [baselineState, setBaselineState] = React.useState(defaultBaselineId)
  const requestedBaseline = baselineProp ?? baselineState
  const baseline = candidates.find((candidate) => candidate.id === requestedBaseline) ?? candidates[0]
  const setBaseline = (id: string) => {
    if (baselineProp === undefined) setBaselineState(id)
    onBaselineChange?.(id)
  }

  const [announcement, setAnnouncement] = React.useState("")
  const castVote = (next: EvalVote) => {
    if (!onVote) return
    onVote(next)
    const candidate = candidates.find((entry) => entry.id === next)
    setAnnouncement(next === null ? "" : labels.voted(next === "tie" ? null : candidate?.label ?? next))
  }

  const diffs = React.useMemo(() => {
    const map = new Map<string, WordDiffPart[]>()
    if (!diff || !baseline) return map
    for (const candidate of candidates) {
      if (candidate.id !== baseline.id) map.set(candidate.id, diffWords(baseline.output, candidate.output))
    }
    return map
  }, [diff, baseline, candidates])

  const showCases = caseCount !== undefined && caseCount > 1 && onCaseChange && caseIndex !== undefined
  const hasAssertions = candidates.some((candidate) => candidate.assertions?.length)
  const columns = Math.min(Math.max(candidates.length, 1), 4)

  return (
    <div
      // A named group, not a landmark, so several comparisons on a page stay distinct.
      role="group"
      aria-label={labels.region}
      data-slot="eval-compare"
      className={cn(
        "@container w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        hairline,
        regularText,
        className
      )}
      {...props}
    >
      {/* Prompt, case switcher, and diff toggle. */}
      <div
        data-slot="eval-compare-header"
        className={cn("flex flex-col gap-[var(--hui-space-3)] border-b-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-4)]", hairline)}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]">
          <span
            id={regionId}
            className={cn("me-auto [font-weight:var(--hui-font-weight-medium)]", secondary, metaText)}
          >
            {labels.prompt}
          </span>
          {showCases && (
            <div data-slot="eval-compare-cases" className="flex items-center gap-[var(--hui-space-1)]">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.previousCase}
                disabled={caseIndex <= 0}
                onClick={() => onCaseChange(caseIndex - 1)}
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <span aria-live="polite" className={cn("min-w-[9ch] text-center tabular-nums", secondary, metaText)}>
                {labels.caseCount(caseIndex, caseCount)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.nextCase}
                disabled={caseIndex >= caseCount - 1}
                onClick={() => onCaseChange(caseIndex + 1)}
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          )}
          {candidates.length > 1 && (
            <Toggle
              size="sm"
              data-slot="eval-compare-diff-toggle"
              pressed={diff}
              onPressedChange={setDiff}
              className={metaText}
            >
              <DiffIcon aria-hidden="true" className="size-3.5" />
              {labels.showDiff}
            </Toggle>
          )}
        </div>
        {prompt !== undefined && (
          <div aria-labelledby={regionId} role="group" className="m-0 min-w-0 whitespace-pre-wrap break-words">
            {prompt}
          </div>
        )}
        {expected !== undefined && (
          <div
            data-slot="eval-compare-expected"
            className={cn(
              "flex min-w-0 gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
              metaText
            )}
          >
            <span className={cn("shrink-0 [font-weight:var(--hui-font-weight-medium)]", secondary)}>{labels.expected}</span>
            <span className="min-w-0 whitespace-pre-wrap break-words">{expected}</span>
          </div>
        )}
      </div>

      {/* One column per candidate. Rows line up across columns through subgrid. */}
      <div
        data-slot="eval-compare-columns"
        style={{ "--eval-columns": columns } as React.CSSProperties}
        className="grid grid-cols-1 @lg:grid-cols-[repeat(var(--eval-columns),minmax(11rem,1fr))] @lg:overflow-x-auto"
      >
        {candidates.map((candidate, index) => {
          const isBaseline = diff && candidate.id === baseline?.id
          const parts = diffs.get(candidate.id)
          const passedCount = candidate.assertions?.filter((assertion) => assertion.passed).length ?? 0
          const isPreferred = vote === candidate.id
          return (
            <article
              key={candidate.id}
              aria-labelledby={`${regionId}-${index}`}
              data-slot="eval-compare-candidate"
              data-baseline={isBaseline || undefined}
              data-preferred={isPreferred || undefined}
              className={cn(
                "row-span-4 grid min-w-0 grid-rows-subgrid gap-0 border-b-[0.5px] last:border-b-0 @lg:border-b-0 @lg:border-e-[0.5px] @lg:last:border-e-0",
                hairline,
                isPreferred && "bg-[var(--hui-color-background-base-secondary)]"
              )}
            >
              <header className="flex min-w-0 items-start gap-[var(--hui-space-3)] px-[var(--hui-space-5)] pt-[var(--hui-space-4)]">
                <div className="min-w-0 flex-1">
                  <p
                    id={`${regionId}-${index}`}
                    className="m-0 truncate [font-weight:var(--hui-font-weight-medium)]"
                  >
                    {candidate.label}
                  </p>
                  {candidate.meta && <p className={cn("m-0 truncate", secondary, metaText)}>{candidate.meta}</p>}
                </div>
                {isBaseline ? (
                  <span
                    data-slot="eval-compare-baseline"
                    className={cn(
                      "shrink-0 rounded-[var(--hui-radius-1)] border-[0.5px] px-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
                      hairline,
                      secondary,
                      metaText
                    )}
                  >
                    {labels.baseline}
                  </span>
                ) : diff ? (
                  <Button
                    variant="link"
                    size="xs"
                    className={cn("h-auto shrink-0 px-0", secondary, metaText)}
                    onClick={() => setBaseline(candidate.id)}
                  >
                    {labels.useAsBaseline(candidate.label)}
                  </Button>
                ) : null}
              </header>

              <div data-slot="eval-compare-output" className="min-w-0 px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
                {parts ? (
                  <>
                    <p className="m-0 whitespace-pre-wrap break-words">
                      {parts.map((part, partIndex) =>
                        part.type === "equal" ? (
                          <React.Fragment key={partIndex}>{part.text}</React.Fragment>
                        ) : part.type === "added" ? (
                          <ins
                            key={partIndex}
                            title={labels.added}
                            className="rounded-[3px] bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-success-primary-hover)] no-underline [box-decoration-break:clone]"
                          >
                            {part.text}
                          </ins>
                        ) : (
                          <del
                            key={partIndex}
                            title={labels.removed}
                            className="text-[var(--hui-color-foreground-danger-primary)] decoration-[var(--hui-color-foreground-danger-primary)]"
                          >
                            {part.text}
                          </del>
                        )
                      )}
                    </p>
                    <p className={cn("m-0 mt-[var(--hui-space-3)] tabular-nums", secondary, metaText)}>
                      {labels.diffSummary(countWords(parts, "added"), countWords(parts, "removed"))}
                    </p>
                  </>
                ) : renderOutput && !diff ? (
                  renderOutput(candidate)
                ) : (
                  <p className="m-0 whitespace-pre-wrap break-words">{candidate.output}</p>
                )}
              </div>

              <div className="min-w-0 px-[var(--hui-space-5)]">
                {hasAssertions && candidate.assertions?.length ? (
                  <div data-slot="eval-compare-checks" className={cn("border-t-[0.5px] py-[var(--hui-space-3)]", hairline)}>
                    <p className={cn("m-0 mb-[var(--hui-space-2)] tabular-nums", secondary, metaText)}>
                      {labels.checks(passedCount, candidate.assertions.length)}
                    </p>
                    <ul className="m-0 flex list-none flex-col gap-[var(--hui-space-2)] p-0">
                      {candidate.assertions.map((assertion, assertionIndex) => (
                        <li key={assertionIndex} className={cn("flex min-w-0 items-start gap-[var(--hui-space-2)]", metaText)}>
                          {assertion.passed ? (
                            <CheckIcon aria-hidden="true" className="mt-[2px] size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
                          ) : (
                            <CircleXIcon aria-hidden="true" className="mt-[2px] size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]" />
                          )}
                          <span className="min-w-0">
                            <span className="sr-only">{assertion.passed ? labels.passed : labels.failed}: </span>
                            <span className={assertion.passed ? undefined : "text-[var(--hui-color-foreground-danger-primary)]"}>
                              {assertion.label}
                            </span>
                            {assertion.detail && <span className={cn("block", secondary)}>{assertion.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 items-end px-[var(--hui-space-5)] pb-[var(--hui-space-4)]">
                {onVote && (
                  <Button
                    variant={isPreferred ? "secondary" : "outline"}
                    size="xs"
                    data-slot="eval-compare-prefer"
                    aria-pressed={isPreferred}
                    onClick={() => castVote(isPreferred ? null : candidate.id)}
                  >
                    {isPreferred ? <CheckIcon aria-hidden="true" /> : <ThumbsUpIcon aria-hidden="true" />}
                    {labels.preferButton}
                    <span className="sr-only"> {candidate.label}</span>
                  </Button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {metrics && metrics.length > 0 && (
        <EvalScorecard candidates={candidates} metrics={metrics} labels={labels} />
      )}

      {onVote && (
        <div
          data-slot="eval-compare-footer"
          className={cn("flex items-center justify-end gap-[var(--hui-space-3)] border-t-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-3)]", hairline)}
        >
          <span aria-live="polite" className={cn("me-auto", secondary, metaText)}>
            {announcement}
          </span>
          <Button
            variant={vote === "tie" ? "secondary" : "ghost"}
            size="xs"
            data-slot="eval-compare-tie"
            aria-pressed={vote === "tie"}
            onClick={() => castVote(vote === "tie" ? null : "tie")}
          >
            <EqualIcon aria-hidden="true" />
            {labels.tie}
          </Button>
        </div>
      )}
    </div>
  )
}

function EvalScorecard({
  candidates,
  metrics,
  labels,
}: {
  candidates: EvalCandidate[]
  metrics: EvalMetric[]
  labels: EvalCompareLabels
}) {
  return (
    <div data-slot="eval-compare-scorecard" className={cn("overflow-x-auto border-t-[0.5px]", hairline)}>
      <table className={cn("w-full border-collapse tabular-nums", metaText)}>
        <caption className="sr-only">{labels.scorecard}</caption>
        <thead>
          <tr className={cn("border-b-[0.5px]", hairline)}>
            <th
              scope="col"
              className={cn("py-[var(--hui-space-3)] ps-[var(--hui-space-5)] pe-[var(--hui-space-4)] text-start [font-weight:var(--hui-font-weight-medium)]", secondary)}
            >
              {labels.scorecard}
            </th>
            {candidates.map((candidate) => (
              <th
                key={candidate.id}
                scope="col"
                className={cn("px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-end [font-weight:var(--hui-font-weight-medium)] last:pe-[var(--hui-space-5)]", secondary)}
              >
                {candidate.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const winners = bestIds(metric, candidates)
            return (
              <tr key={metric.key} data-slot="eval-compare-metric" className={cn("border-b-[0.5px] last:border-b-0", hairline)}>
                <th
                  scope="row"
                  className={cn("py-[var(--hui-space-3)] ps-[var(--hui-space-5)] pe-[var(--hui-space-4)] text-start [font-weight:var(--hui-font-weight-regular)]", secondary)}
                >
                  {metric.label}
                </th>
                {candidates.map((candidate) => {
                  const value = candidate.metrics?.[metric.key]
                  const isBest = winners.has(candidate.id)
                  return (
                    <td
                      key={candidate.id}
                      data-best={isBest || undefined}
                      className={cn(
                        "px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-end whitespace-nowrap last:pe-[var(--hui-space-5)]",
                        isBest && "[font-weight:var(--hui-font-weight-medium)]"
                      )}
                    >
                      {typeof value === "number" && Number.isFinite(value) ? (
                        <span className="inline-flex items-center justify-end gap-[var(--hui-space-2)]">
                          {isBest && (
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full bg-[var(--hui-color-foreground-base-primary)]"
                            />
                          )}
                          {formatMetric(metric, value)}
                          {isBest && <span className="sr-only"> ({labels.best})</span>}
                        </span>
                      ) : (
                        <span className={secondary}>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">{labels.noValue}</span>
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { EvalCompare }
