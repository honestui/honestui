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
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <div className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
        <div className="flex min-w-0 flex-col">
          <span id={labelId} className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]">
            Email me a weekly summary
          </span>
          <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            Activity across your projects, every Monday morning.
          </span>
        </div>
        <Switch
          aria-labelledby={labelId}
          checked={isSubscribed}
          readOnly={save.isBusy}
          onCheckedChange={(next) => void save.run(next)}
          // Forced colors removes the track and thumb fills, so draw both with system colors.
          className="forced-colors:box-content forced-colors:border forced-colors:border-[ButtonText] forced-colors:[&>span]:bg-[ButtonText]"
        />
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
