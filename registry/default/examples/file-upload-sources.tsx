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
          <FileUploadBrowse />
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>

      <label className="-mt-[var(--hui-space-2)] flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
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
          <FileUploadBrowse>Open camera</FileUploadBrowse>
        </FileUploadDropzone>
        <FileUploadList />

        <div className="mt-[var(--hui-space-3)] flex items-center justify-between gap-[var(--hui-space-3)]">
          <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
            Camera
          </span>
          <div className="inline-flex h-8 items-center gap-[var(--hui-space-1)] rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-1)]">
            {(
              [
                ["environment", "Back camera"],
                ["user", "Front camera"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => setDirection(value)}
                className={
                  "h-full rounded-[calc(var(--hui-radius-1)-2px)] px-[var(--hui-space-4)] outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out)] focus-visible:[outline:var(--hui-focus-ring)] " +
                  (direction === value
                    ? "bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[0_0_0_0.5px_var(--hui-color-border-base-secondary)]"
                    : "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </FileUpload>
    </div>
  )
}
