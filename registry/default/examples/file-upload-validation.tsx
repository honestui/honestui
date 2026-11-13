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
import { makeSampleFile } from "./file-upload-example-utils"
import {
  FileUploadDemoHeader,
  FileUploadDemoTitle,
  FileUploadSampleButton,
} from "./file-upload-sample-button"

/**
 * validateFile adds rules HonestUI cannot guess. This one bans spaces in
 * names because an import pipeline chokes on them; the returned sentence
 * renders verbatim on the rejected row and reaches screen readers once.
 */
export default function FileUploadValidation() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-xl flex-col gap-[var(--hui-space-2)]">
      <FileUploadDemoHeader
        action={
          <FileUploadSampleButton
            containerRef={containerRef}
            files={() => [
              makeSampleFile("my resume draft.txt", {
                type: "text/plain",
                contents: ["name: someone\nrole: something"],
              }),
              makeSampleFile("clean-name.csv", {
                type: "text/csv",
                contents: ["id,name", "1,connor"],
              }),
            ]}
          />
        }
      >
        <FileUploadDemoTitle>Supporting documents</FileUploadDemoTitle>
      </FileUploadDemoHeader>
      <FileUpload
        multiple
        validateFile={(file) => {
          if (file.name.includes(" ")) {
            return "File names cannot contain spaces."
          }

          return null
        }}
      >
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>
            Drop a file with no spaces in its name
          </FileUploadTitle>
          <FileUploadDescription>
            Custom rule: use dashes instead of spaces
          </FileUploadDescription>
          <FileUploadBrowse />
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>
    </div>
  )
}
