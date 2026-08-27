"use client"

import * as React from "react"

import {
  FileUpload,
  FileUploadList,
  type FileUploadItemData,
} from "@/registry/default/product/file-upload/file-upload"
import {
  makeSampleFile,
  makeSampleJpegFile,
  makeSamplePngFile,
} from "./file-upload-example-utils"

const TICK_MS = 260

/** Steady climbs toward done, one unknown-length ride, one scripted drop. */
const PLANS: Record<string, { increment?: number }> = {
  report: { increment: 7 },
  invoice: { increment: 13 },
}

/**
 * Four rows caught mid-story: a determinate climb, an upload with no
 * computable percentage, a completed transfer, and a connection loss whose
 * Retry replays cleanly because the app still holds the original File.
 */
export default function FileUploadStates() {
  const [items, setItems] = React.useState<FileUploadItemData[]>([
    {
      id: "expenses-png",
      file: makeSamplePngFile("team-expenses.png", { size: 640 * 1024 }),
      status: "success",
      progress: 100,
    },
    {
      id: "recording",
      file: makeSampleFile("all-hands-recording.wav", {
        type: "audio/wav",
        size: 48 * 1024 * 1024,
      }),
      status: "uploading",
      progress: null,
    },
    {
      id: "expenses-jpg",
      file: makeSampleJpegFile("team-expenses.jpg", {
        size: 640 * 1024,
      }),
      status: "success",
      progress: 100,
    },
    {
      id: "invoice",
      file: makeSampleFile("invoice-march.pdf", {
        type: "application/pdf",
        size: 1.4 * 1024 * 1024,
      }),
      status: "error",
      error: "Upload failed. The connection was lost mid-transfer.",
    },
  ])

  const attemptsRef = React.useRef(new Map<string, number>([["invoice", 1]]))
  const recordingTickRef = React.useRef(0)

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      recordingTickRef.current += 1

      const recordingDone = recordingTickRef.current >= 11

      setItems((current) =>
        current.map((item) => {
          if (item.status !== "uploading") return item

          // Invoice sits still until its second attempt earns motion.
          if (item.id === "invoice" && (attemptsRef.current.get("invoice") ?? 0) < 2) {
            return item
          }

          if (item.id === "recording") {
            return recordingDone
              ? { ...item, status: "success" as const }
              : item
          }

          const plan = PLANS[item.id]

          if (!plan?.increment) return item

          const next = Math.min(
            100,
            (typeof item.progress === "number" ? item.progress : 0) +
              plan.increment
          )

          return next === 100
            ? { ...item, status: "success" as const, progress: 100 }
            : { ...item, progress: next }
        })
      )
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  function handleRetry(item: FileUploadItemData) {
    attemptsRef.current.set(item.id, (attemptsRef.current.get(item.id) ?? 0) + 1)

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: "uploading",
              progress: null,
              error: undefined,
            }
          : entry
      )
    )
  }

  return (
    <div className="w-full min-w-0 max-w-xl">
      <FileUpload value={items} onValueChange={setItems} multiple onRetry={handleRetry}>
        <FileUploadList showImagePreviews={false} />
      </FileUpload>

      <p className="mt-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
        Sizes are stand-in metadata; no network requests leave this page.
      </p>
    </div>
  )
}
