"use client"

import * as React from "react"

import {
  SavedViews,
  type SavedView,
  type SavedViewState,
} from "@/registry/default/product/saved-views/saved-views"

const views: SavedView[] = [
  { id: "inbox", name: "Inbox", locked: true, state: { sorting: [{ id: "updated", desc: true }] } },
  {
    id: "mine",
    name: "Assigned to me",
    state: {
      filters: [{ key: "assignee", value: ["me"] }],
      sorting: [{ id: "priority", desc: true }],
    },
  },
  {
    id: "escalations",
    name: "Escalations",
    shared: true,
    state: { filters: [{ key: "priority", value: ["urgent"] }] },
  },
]

/**
 * The built-in Inbox view has been changed: a filter was added. It is locked,
 * so the only way to keep the change is a new view.
 */
export default function SavedViewsStates() {
  const [activeViewId, setActiveViewId] = React.useState("inbox")
  const [state, setState] = React.useState<SavedViewState>({
    sorting: [{ id: "updated", desc: true }],
    filters: [{ key: "channel", value: ["email"] }],
  })
  const [list, setList] = React.useState(views)

  return (
    <div className="w-full max-w-2xl rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
      <SavedViews
        views={list}
        activeViewId={activeViewId}
        defaultViewId="mine"
        currentState={state}
        onActiveViewChange={(id, view) => {
          setActiveViewId(id)
          setState(view.state)
        }}
        onSaveAsNew={(name, saved) => {
          const id = `custom-${list.length}`
          setList((current) => [...current, { id, name, state: saved }])
          setActiveViewId(id)
        }}
        onSave={(id, saved) =>
          setList((current) =>
            current.map((view) => (view.id === id ? { ...view, state: saved } : view))
          )
        }
      />
    </div>
  )
}
