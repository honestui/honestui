"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadTitle,
} from "@/registry/default/product/file-upload/file-upload"

/**
 * Drag any files from your desktop over both zones. Browsers only reveal
 * the carried count during a drag, so the right zone turns red the moment
 * its one open slot is outnumbered; type and size still check on drop.
 */
export default function FileUploadDragOver() {
  return (
    <div className="grid w-full min-w-0 gap-[var(--hui-space-4)] sm:grid-cols-2">
      <FileUpload multiple>
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Drop to upload</FileUploadTitle>
          <FileUploadDescription>Any number of files</FileUploadDescription>
        </FileUploadDropzone>
      </FileUpload>

      <FileUpload maxFiles={1} multiple>
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>One slot only</FileUploadTitle>
          <FileUploadDescription>Dragging two or more turns this red</FileUploadDescription>
        </FileUploadDropzone>
      </FileUpload>

      <p className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)] sm:col-span-2">
        Borders shift color on valid and invalid drags; nothing bounces.
      </p>
    </div>
  )
}
