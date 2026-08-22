"use client"

import * as React from "react"

import { LoaderCircle as LoaderCircleIcon } from "honestui/icons"
import { Label } from "@/registry/default/ui/label"
import { Switch } from "@/registry/default/ui/switch"

async function savePreference(enabled: boolean): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (!enabled) {
    throw new Error("Could not reach the server")
  }
}

export default function SwitchPendingDemo() {
  const [checked, setChecked] = React.useState(true)
  const [pending, setPending] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  const onCheckedChange = async (next: boolean) => {
    setPending(true)
    setFailed(false)
    try {
      await savePreference(next)
      setChecked(next)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid w-auto gap-1">
      <Label className="gap-2">
        <Switch
          checked={checked}
          disabled={pending}
          onCheckedChange={onCheckedChange}
        />
        {pending && (
          <LoaderCircleIcon
            className="size-4 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
        Marketing emails
      </Label>
      <p className="text-sm text-muted-foreground" role="status">
        {pending
          ? "Saving…"
          : failed
            ? "Couldn't save. Try again."
            : checked
              ? "On"
              : "Off"}
      </p>
    </div>
  )
}
