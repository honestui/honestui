"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadTitle,
} from "@/registry/default/product/file-upload/file-upload"
import { Field, FieldLabel } from "@/registry/default/ui/field"

/**
 * Disabled matches every other HonestUI control: muted border and text, no
 * picker, no drops, nothing focusable. Composed inside Field with the label
 * pointing at the dropzone id so assistive tech names it directly.
 */
export default function FileUploadDisabled() {
  return (
    <div className="grid w-full min-w-0 gap-[var(--hui-space-5)] sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="file-upload-enabled-zone">Attachments</FieldLabel>

        <FileUpload>
          <FileUploadDropzone id="file-upload-enabled-zone">
            <FileUploadIcon />
            <FileUploadTitle>Enabled sibling for contrast</FileUploadTitle>
            <FileUploadDescription>PDF up to 10 MB</FileUploadDescription>
          </FileUploadDropzone>
        </FileUpload>
      </Field>

      <Field data-disabled>
        <FieldLabel htmlFor="file-upload-disabled-zone">Locked attachments</FieldLabel>

        <FileUpload disabled>
          <FileUploadDropzone
            id="file-upload-disabled-zone"
            aria-describedby="lock-note"
          >
            <FileUploadIcon />
            <FileUploadTitle>File upload is disabled</FileUploadTitle>
            <FileUploadDescription>Billing must be restored first</FileUploadDescription>
          </FileUploadDropzone>
        </FileUpload>
        <span id="lock-note" className="sr-only">
          Attachments unlock after billing is restored.
        </span>
      </Field>
    </div>
  )
}
