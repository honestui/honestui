"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadSummary,
  FileUploadTrigger,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { Button } from "@/registry/default/ui/button"
import { makeSampleFile, makeSampleSvgFile } from "./file-upload-example-utils"
import { FileUploadSampleButton } from "./file-upload-sample-button"

/**
 * Compact forms and importers skip the dropzone entirely. The summary line
 * mirrors the picker's own "No file chosen" convention and updates through
 * the same controlled state. Sample picks prove the wiring even where the
 * native chooser is unavailable.
 */
export default function FileUploadButtonOnly() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState<FileUploadItemData[]>([])

  return (
    <div className="flex min-h-[128px] w-full items-center justify-center">
      <div
        ref={containerRef}
        className="flex w-full max-w-xl flex-wrap items-center justify-between gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-4)]"
      >
        <FileUpload
          value={value}
          onValueChange={setValue}
          className="flex w-auto min-w-0 flex-1 items-center gap-[var(--hui-space-4)]"
        >
          <FileUploadTrigger render={<Button variant="outline" size="sm" />}>
            {value.length === 0 ? "Choose file" : "Choose another file"}
          </FileUploadTrigger>
          <FileUploadSummary className="max-w-72" />
        </FileUpload>

        <FileUploadSampleButton
          containerRef={containerRef}
          files={() => [
            makeSampleSvgFile("field-notes", 205, 155),
            makeSampleFile("budget-2026.csv", {
              type: "text/csv",
              contents: ["month,spend", "aug,412"],
              size: 64 * 1024,
            }),
          ]}
          label="Try samples"
          className="text-[var(--hui-color-foreground-base-secondary)]"
        />
      </div>
    </div>
  )
}
