"use client"

import * as React from "react"

import {
  ActionButton,
  ActionStatus,
  useAsyncAction,
} from "@/registry/default/product/async-action/async-action"

type Project = { id: string; name: string }

// Sample projects.
const sampleProjects: Project[] = [
  { id: "p1", name: "Docs refresh" },
  { id: "p2", name: "Billing migration" },
  { id: "p3", name: "Onboarding emails" },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview; both requests are timers. The hook
 * lives above the list, so its state outlives the row that Archive removes.
 */
export default function AsyncActionDemo() {
  const [projects, setProjects] = React.useState(sampleProjects)

  const archive = useAsyncAction({
    action: async (project: Project) => {
      await wait(900)
      return project
    },
    optimistic: (project) => {
      setProjects((current) => current.filter((item) => item.id !== project.id))
      // Put the project back where it was, whatever else changed meanwhile.
      return () =>
        setProjects((current) =>
          sampleProjects.filter(
            (item) => item.id === project.id || current.some((kept) => kept.id === item.id)
          )
        )
    },
    undo: () => wait(600),
  })

  const name = archive.state.phase === "idle" ? "" : archive.state.input.name

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-[var(--hui-space-4)]">
      {projects.length === 0 ? (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
          No active projects.
        </p>
      ) : (
        <ul
          aria-label="Active projects"
          className="m-0 list-none rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] p-0 [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-secondary)]"
        >
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]"
            >
              <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
                {project.name}
              </span>
              <ActionButton
                action={archive}
                input={project}
                variant="secondary"
                size="sm"
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
          undoing: `Restoring ${name}…`,
          undone: `${name} restored.`,
        }}
      />
    </div>
  )
}
