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

/**
 * allowPaste listens only while focus sits inside this uploader, so a copy
 * hotkey meant for a nearby input never gets hijacked. Paste a screenshot
 * after focusing the zone and the usual rules apply unchanged.
 */
export default function FileUploadPaste() {
  const [note, setNote] = React.useState("Nothing picked yet.")

  return (
    <div className="w-full min-w-0 max-w-xl">
      <FileUpload
        allowPaste
        accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
        maxSize={10 * 1024 * 1024}
        onAccept={(items) => {
          setNote(
            items.length === 1
              ? `Picked up ${items[0].file.name} · ${formatFileSize(items[0].file.size)}`
              : `Picked up ${items.length} files`
          )
        }}
      >
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Focus here and paste a screenshot</FileUploadTitle>
          <FileUploadDescription>
            Clipboard files follow the same PNG or JPG rules, up to 10 MB
          </FileUploadDescription>
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>

      <p
        aria-live="polite"
        className="mt-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
      >
        {note}
      </p>
    </div>
  )
}
