"use client"

import * as React from "react"

import {
  ActionButton,
  ActionStatus,
  useAsyncAction,
} from "@/registry/default/product/async-action/async-action"

type Project = { id: string; name: string; meta: string }

// Sample projects.
const sampleProjects: Project[] = [
  { id: "p4", name: "Q3 roadmap", meta: "18 tasks · Updated 5h ago" },
  { id: "p5", name: "Support macros", meta: "9 tasks · Updated last week" },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview. The first attempt is rejected on
 * purpose to show the failure state; the next attempt resolves. No `undo` is
 * passed, so success offers no Undo.
 */
export default function AsyncActionFailureExample() {
  const [projects, setProjects] = React.useState(sampleProjects)
  const attempts = React.useRef(0)

  const archive = useAsyncAction<Project>({
    action: async () => {
      attempts.current += 1
      await wait(700)
      if (attempts.current === 1) {
        throw new Error("This preview rejects the first attempt.")
      }
    },
    optimistic: (project) => {
      setProjects((current) => current.filter((item) => item.id !== project.id))
      return () =>
        setProjects((current) =>
          sampleProjects.filter(
            (item) => item.id === project.id || current.some((kept) => kept.id === item.id)
          )
        )
    },
  })

  const name = archive.state.phase === "idle" ? "" : archive.state.input.name

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      {projects.length === 0 ? (
        <p className="m-0 flex min-h-14 items-center justify-center rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
          No active projects.
        </p>
      ) : (
        <ul
          aria-label="Projects to archive"
          className="m-0 list-none overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0 [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
        >
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex min-h-14 min-w-0 items-center justify-between gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out)] hover:bg-[var(--hui-color-background-base-primary-hover)]"
            >
              <span className="flex min-w-0 flex-col">
                <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]">
                  {project.name}
                </span>
                <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
                  {project.meta}
                </span>
              </span>
              <ActionButton
                action={archive}
                input={project}
                variant="outline"
                size="sm"
                className="shrink-0 shadow-none px-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]"
                aria-label={`Archive ${project.name}`}
              >
                Archive
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
      <ActionStatus
        action={archive}
        labels={{
          pending: `Archiving ${name}…`,
          success: `${name} archived.`,
          error: `The request failed, so ${name} is back in the list.`,
        }}
      />
    </div>
  )
}
