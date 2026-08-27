"use client"

import * as React from "react"

import type { FileUploadControllerValue } from "./file-upload-types"

export const FileUploadControllerContext =
  React.createContext<FileUploadControllerValue | null>(null)

FileUploadControllerContext.displayName = "FileUploadControllerContext"

export function useFileUploadController(
  componentName: string
): FileUploadControllerValue {
  const controller = React.useContext(FileUploadControllerContext)

  if (!controller) {
    throw new Error(
      `<${componentName}> must be rendered inside <FileUpload> so it can read selection state.`
    )
  }

  return controller
}
