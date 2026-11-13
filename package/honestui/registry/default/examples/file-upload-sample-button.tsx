"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

import { runSamplesThroughInput } from "./file-upload-example-utils"

export interface FileUploadSampleButtonProps {
  /** Wrapper around one <FileUpload>; its hidden input receives the files. */
  containerRef: React.RefObject<HTMLElement | null>
  /** Factory so every press hands over fresh File objects. */
  files: () => File[]
  label?: string
  className?: string
}

/**
 * Quiet affordance for docs previews: pushes prepared sample files through
 * the uploader's real input pipeline, so visitors without a native chooser
 * (or a blocked one) still see validation, rows, and statuses move.
 */
export function FileUploadSampleButton({
  containerRef,
  files,
  label = "Try a sample file",
  className,
}: FileUploadSampleButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => {
        runSamplesThroughInput(containerRef.current, files())
      }}
    >
      {label}
    </Button>
  )
}

/**
 * Field header used by the docs previews: the label on the left, a 32px
 * action on the right, one row height so nothing floats as an orphan.
 */
export function FileUploadDemoHeader({
  children,
  action,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-8 items-center justify-between gap-[var(--hui-space-4)]",
        className
      )}
    >
      {children}
      {action}
    </div>
  )
}

/** Plain heading for previews that have no <Field> label to borrow. */
export function FileUploadDemoTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)]">
      {children}
    </p>
  )
}

/** 12px secondary helper line that sits under its control. */
export const demoHelperText =
  "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
