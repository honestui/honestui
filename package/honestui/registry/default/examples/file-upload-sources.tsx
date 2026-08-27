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
import { Switch } from "@/registry/default/ui/switch"

/**
 * Two less common entry doors in one place because both are opt-in props:
 * folder selection through the directory picker, and camera capture on
 * phones. Desktop capture buttons simply open the normal picker.
 */
export default function FileUploadSources() {
  const [pickFolders, setPickFolders] = React.useState(false)
  const [direction, setDirection] = React.useState<"user" | "environment">("environment")

  return (
    <div className="flex w-full min-w-0 max-w-2xl flex-col gap-[var(--hui-space-5)]">
      <FileUpload
        directory={pickFolders}
        accept={{ "image/*": [] }}
        multiple
      >
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Drop images or browse</FileUploadTitle>
          <FileUploadDescription>
            {pickFolders
              ? "Whole folders count; browser support varies"
              : "Switch below to pick folders instead of files"}
          </FileUploadDescription>
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>

      <label className="flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        <Switch
          checked={pickFolders}
          onCheckedChange={(checked) => setPickFolders(Boolean(checked))}
          aria-label="Pick folders instead of files"
        />
        Pick folders instead of files
      </label>

      <FileUpload accept={{ "image/*": [] }} capture={direction}>
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Capture a photo</FileUploadTitle>
          <FileUploadDescription>
            Opens the camera on phones with facing {direction === "environment" ? "back" : "front"}
          </FileUploadDescription>
        </FileUploadDropzone>
        <FileUploadList />

        <div className="mt-[var(--hui-space-3)] flex items-center gap-[var(--hui-space-2)]">
          <button
            type="button"
            onClick={() => setDirection("environment")}
            className={
              direction === "environment"
                ? "font-medium underline underline-offset-4"
                : "text-[var(--hui-color-foreground-base-secondary)] underline-offset-4 hover:underline"
            }
          >
            Back camera
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setDirection("user")}
            className={
              direction === "user"
                ? "font-medium underline underline-offset-4"
                : "text-[var(--hui-color-foreground-base-secondary)] underline-offset-4 hover:underline"
            }
          >
            Front camera
          </button>
        </div>
      </FileUpload>
    </div>
  )
}
