"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadBrowse,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadList,
  FileUploadTitle,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { Button } from "@/registry/default/ui/button"
import { makeSampleFile } from "./file-upload-example-utils"
import {
  demoHelperText,
  FileUploadDemoHeader,
  FileUploadDemoTitle,
  FileUploadSampleButton,
} from "./file-upload-sample-button"

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
    <div ref={containerRef} className="flex w-full min-w-0 max-w-xl flex-col gap-[var(--hui-space-2)]">
      <FileUploadDemoHeader
        action={
          <div className="flex items-center gap-[var(--hui-space-2)]">
            <Button
              variant="ghost"
              size="sm"
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
          </div>
        }
      >
        <FileUploadDemoTitle>Parent-owned files</FileUploadDemoTitle>
      </FileUploadDemoHeader>
      <FileUpload value={value} onValueChange={commit} multiple maxFiles={4}>
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Drop files here or click to browse</FileUploadTitle>
          <FileUploadDescription>Up to 4 files</FileUploadDescription>
          <FileUploadBrowse />
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>
      <p aria-live="polite" className={`${demoHelperText} tabular-nums`}>
        Commits seen by the parent: {commitCount}
      </p>
    </div>
  )
}
