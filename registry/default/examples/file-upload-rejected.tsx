"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadList,
  FileUploadTitle,
} from "@/registry/default/product/file-upload/file-upload"
import { Field, FieldDescription } from "@/registry/default/ui/field"
import { makeSampleFile } from "./file-upload-example-utils"
import { FileUploadSampleButton } from "./file-upload-sample-button"

/**
 * Limits sit deliberately low so ordinary browsing triggers them: two files
 * max, one megabyte total headroom per file, PNG or JPG only. Every reject
 * lands as its own row with the reason spelled out where the file sits.
 */
export default function FileUploadRejected() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="w-full min-w-0 max-w-xl">
      <Field>
        <FileUpload
          accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
          maxSize={1024 * 1024}
          maxFiles={2}
          multiple
        >
          <FileUploadDropzone>
            <FileUploadIcon />
            <FileUploadTitle>Drop a photo to test rejection</FileUploadTitle>
            <FileUploadDescription>
              PNG or JPG under 1 MB · 2 files max
            </FileUploadDescription>
          </FileUploadDropzone>
          <FileUploadList />
        </FileUpload>

        <FieldDescription>
          Try an oversized screenshot, a .mov, or three files at once. Rejected
          rows stay visible with their reason until you dismiss them.
        </FieldDescription>
      </Field>

      <div className="mt-[var(--hui-space-3)]">
        <FileUploadSampleButton
          containerRef={containerRef}
          label="Try two broken samples"
          files={() => [
            makeSampleFile("beach-photo.png", {
              type: "image/png",
              size: 2.4 * 1024 * 1024,
            }),
            makeSampleFile("product-demo.mov", {
              type: "video/quicktime",
              contents: ["not really a movie"],
            }),
          ]}
        />
        <span className="ms-2 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          One is too large, one is the wrong type.
        </span>
      </div>
    </div>
  )
}
