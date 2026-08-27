"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadList,
  FileUploadTitle,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import {
  makeSampleJpegFile,
  makeStockSvgFile,
} from "./file-upload-example-utils"

/**
 * Image pickers live everywhere: avatars, receipts, gallery posts. Two
 * seeded picks ride a short simulated transfer so thumbnails, thin progress
 * bars, and the quiet Uploaded finish all appear without a click.
 */
export default function FileUploadImages() {
  const [value, setValue] = React.useState<FileUploadItemData[]>([])
  const seededRef = React.useRef(false)

  React.useEffect(() => {
    if (seededRef.current) return

    seededRef.current = true

    const samples = [
      makeStockSvgFile("sunset-watch.svg", { size: 184 * 1024 }),
      makeSampleJpegFile("harbor-boats.jpg", { size: 540 * 1024 }),
    ]
    const startRates = [34, 16]

    setValue(
      samples.map((file, index) => ({
        id: `sample-image-${index}`,
        file,
        status: "uploading" as const,
        progress: startRates[index],
      }))
    )

    let ticks = 0
    const timer = window.setInterval(() => {
      ticks += 1

      setValue((current) =>
        current.map((item) => {
          if (item.status !== "uploading") return item

          // Second image moves slower so the two bars read differently.
          const step = item.id.endsWith("1") ? 8 : 12
          const next = Math.min(100, (item.progress ?? 0) + step)

          return next >= 100
            ? { ...item, status: "success" as const, progress: 100 }
            : { ...item, progress: next }
        })
      )

      if (ticks >= 10) window.clearInterval(timer)
    }, 300)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="w-full min-w-0 max-w-xl">
      <FileUpload
        value={value}
        onValueChange={setValue}
        accept={{
          "image/png": [".png"],
          "image/jpeg": [".jpg", ".jpeg"],
          "image/svg+xml": [".svg"],
        }}
        maxSize={8 * 1024 * 1024}
        maxFiles={4}
        multiple
      >
        <FileUploadDropzone>
          <FileUploadIcon />
          <FileUploadTitle>Drop images or browse</FileUploadTitle>
          <FileUploadDescription>
            PNG, JPG, or SVG up to 8 MB · four at a time
          </FileUploadDescription>
        </FileUploadDropzone>
        <FileUploadList />
      </FileUpload>
    </div>
  )
}
