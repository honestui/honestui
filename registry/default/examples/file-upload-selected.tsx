"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadAddMore,
  FileUploadClear,
  FileUploadList,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import { formatFileSize } from "@/registry/default/product/file-upload/file-upload-utils"
import { makeSampleItem, makeSampleSvgFile } from "./file-upload-example-utils"

/**
 * Three already-picked files shown with consistent file-type tiles. Add more
 * files respects the five-file limit and Clear all needs no confirmation for
 * local picks.
 */
export default function FileUploadSelected() {
  const [value, setValue] = React.useState<FileUploadItemData[]>(() => [
    {
      id: "sample-campsite",
      file: makeSampleSvgFile("campsite-photo", 190, 145),
    },
    makeSampleItem("trip-itinerary.pdf", {
      type: "application/pdf",
      size: 2.4 * 1024 * 1024,
    }),
    makeSampleItem("team-handbook.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 820 * 1024,
    }),
  ])

  return (
    <div className="w-full min-w-0 max-w-xl">
      <FileUpload
        id="file-upload-selected"
        value={value}
        onValueChange={setValue}
        maxFiles={5}
        multiple
      >
        <FileUploadList showImagePreviews={false} />

        <div className="mt-[var(--hui-space-3)] flex flex-wrap items-center gap-[var(--hui-space-3)]">
          <FileUploadAddMore>Add more files</FileUploadAddMore>
          <FileUploadClear />
          <span
            aria-live="polite"
            className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
          >
            {value.length} of 5 files selected ·{" "}
            {formatFileSize(value.reduce((sum, item) => sum + item.file.size, 0))}
          </span>
        </div>
      </FileUpload>
    </div>
  )
}
