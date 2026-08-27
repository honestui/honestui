"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { Button } from "@/registry/default/ui/button"
import { makeSamplePngFile } from "./file-upload-example-utils"
import { FileUploadSampleButton } from "./file-upload-sample-button"

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
    <div ref={containerRef} className="w-full min-w-0 max-w-xl">
      <FileUpload
        value={value}
        onValueChange={setValue}
        accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
        maxSize={5 * 1024 * 1024}
      >
        {/* Stays mounted so rejected picks explain themselves while empty. */}
        <FileUploadList />

        {hasFile ? (
          <div className="mt-[var(--hui-space-3)]">
            <FileUploadTrigger render={<Button variant="outline" />}>
              Replace
            </FileUploadTrigger>
          </div>
        ) : (
          <FileUploadDropzone className="mt-[var(--hui-space-3)]">
            <FileUploadIcon />
            <FileUploadTitle>Drop a file or browse</FileUploadTitle>
          </FileUploadDropzone>
        )}
      </FileUpload>

      <div className="mt-[var(--hui-space-2)] flex items-center gap-[var(--hui-space-3)]">
        <p className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          PNG or JPG up to 5 MB
        </p>
        <FileUploadSampleButton
          containerRef={containerRef}
          files={() => [
            makeSamplePngFile("portrait.png", { size: 820 * 1024 }),
          ]}
        />
      </div>
    </div>
  )
}
