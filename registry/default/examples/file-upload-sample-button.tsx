"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"

import { runSamplesThroughInput } from "./file-upload-example-utils"

export interface FileUploadSampleButtonProps {
  /** Wrapper around one <FileUpload>; its hidden input receives the files. */
  containerRef: React.RefObject<HTMLElement | null>
  /** Factory so every press hands over fresh File objects. */
  files: () => File[]
  label?: string
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
}: FileUploadSampleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        runSamplesThroughInput(containerRef.current, files())
      }}
    >
      {label}
    </Button>
  )
}
