"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { Spinner } from "@/registry/default/ui/spinner"

export default function SpinnerButton() {
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const save = () => {
    setSaved(false)
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 1600)
  }

  return (
    <div className="flex flex-col items-center gap-[var(--hui-space-3)]">
      <Button onClick={save} disabled={saving} aria-busy={saving}>
        {/* The label already says what is happening, so the spinner is
            decorative here. */}
        {saving && <Spinner decorative />}
        {saving ? "Saving changes…" : "Save changes"}
      </Button>
      <p
        aria-live="polite"
        className="m-0 min-h-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {saved ? "All changes saved." : ""}
      </p>
    </div>
  )
}
