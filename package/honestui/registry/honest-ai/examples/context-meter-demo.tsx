"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { ContextMeter } from "@/registry/honest-ai/ai/context-meter"

// Sample figures.
const SAMPLE_LIMIT = 200_000
const SAMPLE_FILE_TOKENS = 40_000
const sampleBase = { system: 2_100, messages: 61_300, files: 20_800 }

/**
 * No model or tokenizer is counting here. The numbers are samples, and the
 * button adds a 40,000-token file so the meter passes its two thresholds.
 */
export default function ContextMeterDemo() {
  const [addedFiles, setAddedFiles] = React.useState(0)
  const files = sampleBase.files + addedFiles * SAMPLE_FILE_TOKENS
  const used = sampleBase.system + sampleBase.messages + files

  return (
    <div className="flex w-full max-w-[36rem] min-w-0 flex-col gap-[var(--hui-space-4)]">
      <div className="overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]">
        <div className="flex min-w-0 items-center gap-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]">
              Billing export rounding
            </p>
            <p className="m-0 truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums">
              {`${2 + addedFiles} files attached`}
            </p>
          </div>
          <ContextMeter
            used={used}
            limit={SAMPLE_LIMIT}
            parts={[
              { label: "System prompt", tokens: sampleBase.system },
              { label: "Messages", tokens: sampleBase.messages },
              { label: "Files", tokens: files },
            ]}
            cost="$0.42"
            note="Sample figures. Nothing is counting tokens in this preview."
          />
        </div>
        <p className="m-0 px-[var(--hui-space-5)] py-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [line-height:20px]">
          Totals round at the line level, so the invoice sum drifts by a cent on long orders.
        </p>
      </div>
      <div className="flex flex-wrap gap-[var(--hui-space-2)]">
        <Button variant="secondary" size="sm" onClick={() => setAddedFiles(addedFiles + 1)}>
          Add a 40,000-token file
        </Button>
        <Button variant="ghost" size="sm" disabled={addedFiles === 0} onClick={() => setAddedFiles(0)}>
          Reset
        </Button>
      </div>
    </div>
  )
}
