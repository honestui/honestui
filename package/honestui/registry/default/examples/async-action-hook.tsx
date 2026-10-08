"use client"

import * as React from "react"

import {
  ActionStatus,
  useAsyncAction,
} from "@/registry/default/product/async-action/async-action"
import { Switch } from "@/registry/default/ui/switch"

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * The hook without ActionButton. There is no server behind this preview: the
 * first change is rejected on purpose, so the switch can be seen returning to
 * its saved position. Later changes resolve.
 */
export default function AsyncActionHookExample() {
  const [isSubscribed, setIsSubscribed] = React.useState(false)
  const attempts = React.useRef(0)
  const labelId = React.useId()

  const save = useAsyncAction<boolean>({
    action: async () => {
      attempts.current += 1
      await wait(700)
      if (attempts.current === 1) {
        throw new Error("This preview rejects the first change.")
      }
    },
    optimistic: (next) => {
      setIsSubscribed(next)
      return () => setIsSubscribed(!next)
    },
  })

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-[var(--hui-space-3)]">
      <div className="inline-flex min-h-6 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        <Switch
          aria-labelledby={labelId}
          checked={isSubscribed}
          readOnly={save.isBusy}
          onCheckedChange={(next) => void save.run(next)}
          // Forced colors removes the track and thumb fills, so draw both with system colors.
          className="forced-colors:box-content forced-colors:border forced-colors:border-[ButtonText] forced-colors:[&>span]:bg-[ButtonText]"
        />
        <span id={labelId}>Email me a weekly summary</span>
      </div>
      <ActionStatus
        action={save}
        labels={{
          pending: "Saving…",
          success: "Saved.",
          error: "Not saved. The setting is back to what it was.",
        }}
      />
    </div>
  )
}
