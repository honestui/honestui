"use client"

import * as React from "react"
import { ArrowDown as ArrowDownIcon, Search as SearchIcon } from "honestui/icons"
import { useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type TranscriptWord = {
  text: string
  /** Seconds from the start of the recording. */
  start: number
  end: number
}

export type TranscriptSegment = {
  id: string
  /** Who is talking. Consecutive segments from one speaker share a turn. */
  speaker: string
  start: number
  end: number
  text: string
  /** Word timings, when your speech-to-text returned them. They light up one by one. */
  words?: TranscriptWord[]
}

export type TranscriptViewerLabels = {
  /** The transcript's name. */
  title: string
  jump: string
  /** The name of a segment's button, such as "Seek to 0:12". */
  seek: (time: string) => string
  search: string
  /** The match count, such as "2 of 5". */
  matches: (current: number, total: number) => string
  noMatches: string
  /** Formats a timestamp. */
  time: (seconds: number) => string
}

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

export const defaultTranscriptViewerLabels: TranscriptViewerLabels = {
  title: "Transcript",
  jump: "Jump to current",
  seek: (time) => `Play from ${time}`,
  search: "Search transcript",
  matches: (current, total) => `${current} of ${total}`,
  noMatches: "No matches",
  time: formatTime,
}

export type TranscriptViewerProps = Omit<React.ComponentProps<"div">, "children"> & {
  segments: TranscriptSegment[]
  /** The playback position in seconds. The segment and word under it are highlighted. */
  currentTime?: number
  /** Called with a segment's start when the person chooses it. */
  onSeek?: (seconds: number) => void
  /** Keep the current segment in view as playback moves. Scrolling away pauses this until "Jump to current". */
  follow?: boolean
  /** Show a search field that highlights matches. */
  searchable?: boolean
  labels?: Partial<TranscriptViewerLabels>
}

type Turn = { speaker: string; start: number; segments: TranscriptSegment[] }

function toTurns(segments: TranscriptSegment[]) {
  const turns: Turn[] = []
  for (const segment of segments) {
    const last = turns.at(-1)
    if (last && last.speaker === segment.speaker) last.segments.push(segment)
    else turns.push({ speaker: segment.speaker, start: segment.start, segments: [segment] })
  }
  return turns
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * A transcript that keeps pace with playback. Turns are grouped by speaker,
 * the segment and word being spoken are highlighted, and choosing a segment
 * asks your player to seek there.
 */
function TranscriptViewer({
  segments,
  currentTime = 0,
  onSeek,
  follow = true,
  searchable = false,
  labels: labelsProp,
  className,
  ...props
}: TranscriptViewerProps) {
  const labels = { ...defaultTranscriptViewerLabels, ...labelsProp }
  const shouldReduceMotion = useReducedMotion() ?? false
  const turns = React.useMemo(() => toTurns(segments), [segments])
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const [detached, setDetached] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [matchIndex, setMatchIndex] = React.useState(0)

  const active = segments.find((segment) => currentTime >= segment.start && currentTime < segment.end)
  const activeId = active?.id

  const scrollToSegment = React.useCallback(
    (id: string, attribute = "data-segment-id") => {
      const container = scrollRef.current
      const target = container?.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(id)}"]`)
      if (!container || !target) return
      const top =
        target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - container.clientHeight / 3
      container.scrollTo({ top, behavior: shouldReduceMotion ? "auto" : "smooth" })
    },
    [shouldReduceMotion]
  )

  React.useEffect(() => {
    if (!follow || detached || !activeId) return
    scrollToSegment(activeId)
  }, [activeId, follow, detached, scrollToSegment])

  // Only the person's own scrolling detaches; scrolling done here does not.
  const detach = () => {
    if (follow && activeId) setDetached(true)
  }
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) detach()
  }

  const pattern = React.useMemo(
    () => (query.trim() ? new RegExp(`(${escapeRegExp(query.trim())})`, "gi") : null),
    [query]
  )
  // Where each segment's matches start in the overall count, so marks can be numbered.
  const { matchCount, matchStarts } = React.useMemo(() => {
    const starts = new Map<string, number>()
    let count = 0
    for (const segment of segments) {
      starts.set(segment.id, count)
      if (pattern) count += segment.text.match(pattern)?.length ?? 0
    }
    return { matchCount: count, matchStarts: starts }
  }, [pattern, segments])

  React.useEffect(() => {
    if (!pattern || matchCount === 0) return
    scrollToSegment(String(matchIndex), "data-match-index")
  }, [pattern, matchCount, matchIndex, scrollToSegment])

  const highlight = (segment: TranscriptSegment) => {
    if (!pattern) return segment.text
    const first = matchStarts.get(segment.id) ?? 0
    return segment.text.split(pattern).map((part, index) => {
      if (index % 2 === 0) return part
      const n = first + (index - 1) / 2
      return (
        <mark
          key={index}
          data-match-index={n}
          data-current={n === matchIndex ? "" : undefined}
          className="rounded-[3px] bg-[var(--hui-color-background-attention-secondary,var(--hui-color-background-neutral-secondary))] text-inherit data-[current]:outline data-[current]:outline-1 data-[current]:outline-[var(--hui-color-foreground-base-primary)]"
        >
          {part}
        </mark>
      )
    })
  }

  const renderSegment = (segment: TranscriptSegment) => {
    const isActive = segment.id === activeId
    const isPast = segment.end <= currentTime
    // Word timing only matters while the segment plays; elsewhere plain text is cheaper and searchable.
    const content =
      isActive && segment.words && segment.words.length > 0 && !pattern
        ? segment.words.map((word, index) => (
            <React.Fragment key={index}>
              {index > 0 ? " " : null}
              <span
                data-slot="transcript-word"
                data-active={currentTime >= word.start && currentTime < word.end ? "" : undefined}
                className={cn(
                  "rounded-[3px] transition-colors duration-100",
                  currentTime >= word.start
                    ? "text-[var(--hui-color-foreground-base-primary)]"
                    : "text-[var(--hui-color-foreground-base-secondary)]",
                  "data-[active]:bg-[var(--hui-color-background-neutral-secondary)]"
                )}
              >
                {word.text}
              </span>
            </React.Fragment>
          ))
        : highlight(segment)

    return (
      <button
        key={segment.id}
        type="button"
        data-slot="transcript-segment"
        data-segment-id={segment.id}
        data-active={isActive ? "" : undefined}
        aria-current={isActive ? "true" : undefined}
        aria-label={`${labels.seek(labels.time(segment.start))}: ${segment.text}`}
        onClick={() => onSeek?.(segment.start)}
        className={cn(
          "inline rounded-[4px] p-0 text-start [box-decoration-break:clone] [-webkit-box-decoration-break:clone] transition-colors outline-none hover:bg-[var(--hui-color-background-base-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--hui-color-border-accent-primary)]",
          isActive || isPast || pattern
            ? "text-[var(--hui-color-foreground-base-primary)]"
            : "text-[var(--hui-color-foreground-base-secondary)]",
          isActive && !segment.words?.length && "bg-[var(--hui-color-background-neutral-primary)]"
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      data-slot="transcript-viewer"
      className={cn(
        "relative flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <div className="flex min-h-11 shrink-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
        <p
          id={titleId}
          className="m-0 shrink-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]"
        >
          {labels.title}
        </p>
        {searchable ? (
          <div className="ms-auto flex min-w-0 items-center gap-[var(--hui-space-3)]">
            <label className="flex min-w-0 items-center gap-[var(--hui-space-2)] rounded-[calc(var(--hui-radius-2)-2px)] border-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-3)] focus-within:ring-2 focus-within:ring-[var(--hui-color-border-accent-primary)]">
              <SearchIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
              <input
                data-slot="transcript-search"
                type="search"
                value={query}
                aria-label={labels.search}
                placeholder={labels.search}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setMatchIndex(0)
                  // Searching moves the view, so stop following until asked.
                  if (event.target.value.trim()) detach()
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || matchCount === 0) return
                  event.preventDefault()
                  detach()
                  setMatchIndex((index) => (index + (event.shiftKey ? matchCount - 1 : 1)) % matchCount)
                }}
                className="h-7 w-40 min-w-0 bg-transparent text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-small)] placeholder:text-[var(--hui-color-foreground-base-secondary)]"
              />
            </label>
            {query.trim() ? (
              <span
                role="status"
                className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums"
              >
                {matchCount > 0 ? labels.matches(matchIndex + 1, matchCount) : labels.noMatches}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        data-slot="transcript-scroll"
        tabIndex={0}
        aria-labelledby={titleId}
        role="group"
        onWheel={detach}
        onTouchMove={detach}
        onKeyDown={onKeyDown}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[var(--hui-space-5)] py-[var(--hui-space-4)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--hui-color-border-accent-primary)] focus-visible:ring-inset"
      >
        <ol className="m-0 flex list-none flex-col gap-[var(--hui-space-5)] p-0">
          {turns.map((turn, index) => (
            <li key={`${turn.speaker}-${index}`} data-slot="transcript-turn" className="flex flex-col gap-[var(--hui-space-2)]">
              <p className="m-0 flex items-baseline gap-[var(--hui-space-3)] [font-size:var(--hui-font-size-small)]">
                <span className="text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
                  {turn.speaker}
                </span>
                <time
                  dateTime={`PT${Math.floor(turn.start)}S`}
                  className="text-[var(--hui-color-foreground-base-secondary)] tabular-nums"
                >
                  {labels.time(turn.start)}
                </time>
              </p>
              <p className="m-0 text-pretty [font-size:var(--hui-font-size-regular)] [line-height:22px]">
                {turn.segments.map((segment, i) => (
                  <React.Fragment key={segment.id}>
                    {i > 0 ? " " : null}
                    {renderSegment(segment)}
                  </React.Fragment>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {follow && detached && activeId ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[var(--hui-space-4)] flex justify-center">
          <Button
            data-slot="transcript-jump"
            variant="secondary"
            size="sm"
            className="pointer-events-auto shadow-[var(--hui-shadow-feather)]"
            onClick={() => {
              setDetached(false)
              scrollToSegment(activeId)
            }}
          >
            <ArrowDownIcon aria-hidden="true" />
            {labels.jump}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export { TranscriptViewer }
