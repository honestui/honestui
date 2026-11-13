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
  FileUploadTrigger,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { Button } from "@/registry/default/ui/button"
import { makeSamplePngFile } from "./file-upload-example-utils"
import {
  demoHelperText,
  FileUploadDemoHeader,
  FileUploadDemoTitle,
  FileUploadSampleButton,
} from "./file-upload-sample-button"

/**
 * Single-file tasks should not keep a giant empty dropzone around. After a
 * pick the row takes over, Replace reopens the picker, and removing lands
 * you back on an honest empty state. Dropping again replaces, not stacks.
 */
export default function FileUploadSingle() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState<FileUploadItemData[]>([])
  const hasFile = value.length > 0

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-xl flex-col gap-[var(--hui-space-2)]">
      <FileUploadDemoHeader
        action={
          <FileUploadSampleButton
            containerRef={containerRef}
            files={() => [
              makeSamplePngFile("portrait.png", { size: 820 * 1024 }),
            ]}
          />
        }
      >
        <FileUploadDemoTitle>Profile picture</FileUploadDemoTitle>
      </FileUploadDemoHeader>
      <FileUpload
        value={value}
        onValueChange={setValue}
        accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
        maxSize={5 * 1024 * 1024}
      >
        {/* Stays mounted so rejected picks explain themselves while empty. */}
        <FileUploadList />

        {hasFile ? (
          <div className="mt-[var(--hui-space-3)] flex items-center justify-between gap-[var(--hui-space-3)]">
            <p className={demoHelperText}>PNG or JPG up to 5 MB</p>
            <FileUploadTrigger render={<Button variant="outline" size="sm" />}>
              Replace
            </FileUploadTrigger>
          </div>
        ) : (
          <FileUploadDropzone className="mt-[var(--hui-space-3)] first:mt-0">
            <FileUploadIcon />
            <FileUploadTitle>Drop a file or browse</FileUploadTitle>
            <FileUploadDescription>PNG or JPG up to 5 MB</FileUploadDescription>
            <FileUploadBrowse />
          </FileUploadDropzone>
        )}
      </FileUpload>
    </div>
  )
}
