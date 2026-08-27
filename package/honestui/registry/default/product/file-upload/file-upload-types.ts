import type * as React from "react"

/** Upload lifecycle reported by the application, not by FileUpload. */
export type FileUploadStatus = "pending" | "uploading" | "success" | "error"

/**
 * One selected file plus whatever upload state the application attaches to
 * it. `status` stays optional so a freshly selected file needs no ceremony:
 * pick files first, enrich them once an upload starts.
 */
export interface FileUploadItem {
  id: string
  file: File
  status?: FileUploadStatus
  /** 0-100, or null while progress cannot be calculated. */
  progress?: number | null
  /** Reason the upload failed, shown beside the retry action. */
  error?: string
}

/**
 * A file that failed validation. Rejected files stay listed until dismissed;
 * they never enter `value`.
 */
export interface FileUploadRejection {
  id: string
  file: File
  /** Human-readable reason, safe to render as-is. */
  reason: string
}

/**
 * Files currently dragged over the dropzone. `dragover` events expose how
 * many files are carried, never their names or sizes, so "invalid" means the
 * count already exceeds capacity. Type and size checks run on drop.
 */
export type FileUploadDragState = "idle" | "valid" | "invalid"

/** Where keyboard focus should land after the next commit. */
export type FileUploadFocusTarget =
  | { kind: "fallback" }
  | { kind: "dropzone" }
  | { kind: "item-remove"; itemId: string }
  | { kind: "rejection-remove"; rejectionId: string }

/** MIME-to-extension pairs such as {"image/png": [".png"]}, or an accept string. */
export type FileUploadAccept = Record<string, string[]> | string

/** Attributes forwarded to the hidden native input. */
export interface FileUploadInputAttributes {
  accept?: string
  capture?: "user" | "environment"
  multiple: boolean
  "webkitdirectory"?: ""
}

/**
 * Everything the composed parts share. Applications rarely touch this
 * directly; parts consume it through context.
 */
export interface FileUploadControllerValue {
  value: FileUploadItem[]
  rejections: FileUploadRejection[]
  dragState: FileUploadDragState
  disabled: boolean
  multiple: boolean
  /** False once the limit blocks honest adding; drives trigger disabling. */
  canAddMore: boolean
  /** True when failed rows can call an application retry handler. */
  canRetry: boolean
  selectionError: string | null
  focusRequest: { target: FileUploadFocusTarget; nonce: number } | null
  inputProps: FileUploadInputAttributes
  openPicker(): void
  /** Registers the activating element so focus can return after picking. */
  activateFrom(element: HTMLElement): void
  removeItem(itemId: string): void
  removeRejection(rejectionId: string): void
  clearAll(): void
  retryItem(item: FileUploadItem): void
  rememberDropzoneTrigger(element: HTMLElement | null): void
  requestFocus(target: FileUploadFocusTarget): void
  beginDrag(draggedFileCount: number): void
  refreshDragValidity(draggedFileCount: number): void
  endDrag(): void
  cancelDrag(): void
  completeDrag(files: FileList): void
  announce(message: string): void
}

/**
 * Base props shared by wrapper-style parts so each accepts `className` and
 * native attributes like `id`, which is also how Field labels attach.
 */
export type FileUploadPartProps = React.ComponentProps<"div">
