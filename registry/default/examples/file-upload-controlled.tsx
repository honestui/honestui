"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadList,
  FileUploadTitle,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { Button } from "@/registry/default/ui/button"
import { makeSampleFile } from "./file-upload-example-utils"
import { FileUploadSampleButton } from "./file-upload-sample-button"

function freshSample() {
  return makeSampleFile("kickoff-deck.pdf", {
    type: "application/pdf",
    size: 5.6 * 1024 * 1024,
  })
}

/**
 * State lives above the component, and the readout proves it: every add,
 * remove, and clear flows through the one onValueChange callback the parent
 * owns. Both sample buttons write through that same narrow door.
 */
export default function FileUploadControlled() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState<FileUploadItemData[]>([])
  const [commitCount, setCommitCount] = React.useState(0)

  function commit(items: FileUploadItemData[]) {
    setValue(items)
    setCommitCount((count) => count + 1)
  }

  return (
    <div ref={containerRef} className="w-full min-w-0 max-w-xl">
      <FileUpload value={value} onValueChange={commit} multiple maxFiles={4}>
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Drop files here or click to browse</FileUploadTitle>
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>

      <div className="mt-[var(--hui-space-3)] flex flex-wrap items-center gap-[var(--hui-space-3)]">
        <Button
          variant="outline"
          onClick={() => {
            setValue([])
            setCommitCount((count) => count + 1)
          }}
        >
          Clear through the parent
        </Button>
        <FileUploadSampleButton
          containerRef={containerRef}
          files={() => [freshSample(), freshSample(), freshSample()]}
          label="Commit a sample"
        />
        <span
          aria-live="polite"
          className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
        >
          Commits seen by the parent: {commitCount}
        </span>
      </div>
    </div>
  )
}
