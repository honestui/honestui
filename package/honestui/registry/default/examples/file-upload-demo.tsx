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
import { formatFileSize } from "@/registry/default/product/file-upload/file-upload-utils"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import { makeSampleFile, makeSamplePngFile } from "./file-upload-example-utils"
import { FileUploadSampleButton } from "./file-upload-sample-button"

/**
 * The everyday setup: drop or browse up to five files, real size and type
 * rules, honest rejection reasons, and rows you can remove without any
 * upload machinery behind them.
 */
export default function FileUploadDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [lastEvent, setLastEvent] = React.useState("Nothing picked yet.")

  return (
    <div ref={containerRef} className="w-full min-w-0 max-w-xl">
      <Field>
        <FieldLabel htmlFor="file-upload-demo-zone">Upload files</FieldLabel>
        <FileUpload
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "application/pdf": [".pdf"],
          }}
          maxSize={10 * 1024 * 1024}
          maxFiles={5}
          multiple
          onValueChange={(items) => {
            const totalSize = items.reduce((sum, item) => sum + item.file.size, 0)

            setLastEvent(
              items.length === 0
                ? "Selection cleared."
                : `${items.length} of 5 files selected · ${formatFileSize(totalSize)} total`
            )
          }}
        >
          <FileUploadDropzone
            id="file-upload-demo-zone"
            aria-describedby="file-upload-demo-status"
          >
            <FileUploadIcon />
            <FileUploadTitle>Drop files here or click to browse</FileUploadTitle>
            <FileUploadDescription>PNG, JPG, PDF up to 10 MB</FileUploadDescription>
          </FileUploadDropzone>
          <FileUploadList />
        </FileUpload>
        <FieldDescription id="file-upload-demo-status">
          {lastEvent}
        </FieldDescription>
      </Field>

      <div className="mt-[var(--hui-space-3)]">
        <FileUploadSampleButton
          containerRef={containerRef}
          files={() => [
            makeSamplePngFile("meadow-shot.png", { size: 340 * 1024 }),
            makeSampleFile("trip-deck.pdf", {
              type: "application/pdf",
              size: 1.2 * 1024 * 1024,
            }),
          ]}
        />
      </div>
    </div>
  )
}
