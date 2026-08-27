"use client"

import * as React from "react"
import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import {
  CircleCheck as CircleCheckIcon,
  File as FileGlyph,
  FileSpreadsheet as SpreadsheetGlyph,
  FileText as DocumentGlyph,
  LoaderCircle as LoaderCircleIcon,
  Plus as PlusIcon,
  TriangleAlert as TriangleAlertIcon,
  Upload as UploadIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/registry/default/ui/progress"

import {
  FileUploadControllerContext,
  useFileUploadController,
} from "./file-upload-context"
import type {
  FileUploadAccept,
  FileUploadControllerValue,
  FileUploadDragState,
  FileUploadFocusTarget,
  FileUploadItem,
  FileUploadPartProps,
  FileUploadRejection,
  FileUploadStatus,
} from "./file-upload-types"
import {
  checkFileAgainstRules,
  createFileUploadId,
  formatFileSize,
  getFileExtension,
  toInputAcceptAttribute,
} from "./file-upload-utils"

/**
 * Shared item data type, published here as FileUploadItemData because the
 * composed row component owns the FileUploadItem name.
 */
export type {
  FileUploadAccept,
  FileUploadControllerValue,
  FileUploadDragState,
  FileUploadFocusTarget,
  FileUploadInputAttributes,
  FileUploadItem as FileUploadItemData,
  FileUploadPartProps,
  FileUploadRejection,
  FileUploadStatus,
} from "./file-upload-types"

/** True when a drag carrying `draggedCount` files cannot fit what is chosen. */
function exceedsRemainingCapacity(
  draggedCount: number,
  selectedCount: number,
  options: { multiple: boolean; maxFiles?: number }
) {
  if (!options.multiple) {
    return draggedCount > 1
  }

  if (options.maxFiles === undefined) {
    return false
  }

  return draggedCount > Math.max(0, options.maxFiles - selectedCount)
}

function countDraggedFiles(dataTransfer: DataTransfer | null | undefined) {
  if (!dataTransfer) return 0

  return Array.from(dataTransfer.items).filter((item) => item.kind === "file").length
}

function describeRejections(rejections: FileUploadRejection[]) {
  if (rejections.length === 0) return null

  return rejections.length === 1
    ? `${rejections[0].file.name} rejected. ${rejections[0].reason}`
    : `${rejections.length} files rejected. ${rejections[0].reason}`
}

export interface FileUploadProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** Files owned by your application, each carrying its upload state. */
  value?: FileUploadItem[] | undefined
  defaultValue?: FileUploadItem[] | undefined
  onValueChange?: ((items: FileUploadItem[]) => void) | undefined
  /**
   * MIME-to-extension pairs such as `{"image/png": [".png"]}`, or an HTML
   * accept string. This filters the picker and drives rejection reasons.
   */
  accept?: FileUploadAccept | undefined
  multiple?: boolean
  maxFiles?: number
  /** In bytes; reasons quote the limit back with human units. */
  maxSize?: number
  minSize?: number
  disabled?: boolean
  /** Runs after rules pass and files join the selection. */
  onAccept?: ((items: FileUploadItem[]) => void) | undefined
  /** Runs once per selection with every rejected file and its reason. */
  onReject?: ((rejections: FileUploadRejection[]) => void) | undefined
  onRemove?: ((item: FileUploadItem) => void) | undefined
  /** Your application starts the new request; Retry only reports intent. */
  onRetry?: ((item: FileUploadItem) => void) | undefined
  validateFile?: ((file: File) => string | null) | undefined
  /** Reads pasted files while focus stays inside this uploader. */
  allowPaste?: boolean
  /** Lets pickers choose folders. Support varies by browser; test yours. */
  directory?: boolean
  capture?: "user" | "environment"
}

function FileUpload({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  accept,
  multiple = false,
  maxFiles,
  maxSize,
  minSize,
  disabled = false,
  onAccept,
  onReject,
  onRemove,
  onRetry,
  validateFile,
  allowPaste = false,
  directory = false,
  capture,
  className,
  children,
  ...rootProps
}: FileUploadProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<FileUploadItem[]>(defaultValue)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolledValue

  const [rejections, setRejections] = React.useState<FileUploadRejection[]>([])
  const [dragState, setDragState] = React.useState<FileUploadDragState>("idle")
  const [selectionError, setSelectionError] = React.useState<string | null>(null)
  const [announcement, setAnnouncement] = React.useState<string | null>(null)
  const [focusRequest, setFocusRequest] = React.useState<{
    target: FileUploadFocusTarget
    nonce: number
  } | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const openerRef = React.useRef<HTMLElement | null>(null)
  const dragDepthRef = React.useRef(0)
  const focusNonceRef = React.useRef(0)
  const previousStatusesRef = React.useRef<
    Map<string, FileUploadStatus | undefined> | undefined
  >(undefined)

  // One polite region whose text swaps; content changes re-trigger reads.
  const announce = React.useCallback((message: string) => {
    setAnnouncement(message === "" ? "\u200b" : message)
  }, [])

  const setValue = React.useCallback(
    (nextItems: FileUploadItem[]) => {
      if (!isControlled) {
        setUncontrolledValue(nextItems)
      }

      onValueChange?.(nextItems)
    },
    [isControlled, onValueChange]
  )

  // Single mode always allows opening the picker again: Replace counts as a
  // legitimate reason to open it, only multiple mode has a hard ceiling.
  const maxFilesReached = maxFiles !== undefined && value.length >= maxFiles
  const canAddMore =
    !disabled && (multiple ? !maxFilesReached : true)

  const openPicker = React.useCallback(() => {
    if (disabled) return

    inputRef.current?.click()
  }, [disabled])

  const activateFrom = React.useCallback(
    (element: HTMLElement) => {
      openerRef.current = element
      openPicker()
    },
    [openPicker]
  )

  const rememberDropzoneTrigger = React.useCallback((element: HTMLElement | null) => {
    openerRef.current = element
  }, [])

  const requestFocus = React.useCallback((target: FileUploadFocusTarget) => {
    focusNonceRef.current += 1
    setFocusRequest({ target, nonce: focusNonceRef.current })
  }, [])

  React.useEffect(() => {
    if (focusRequest?.target.kind !== "fallback" || disabled) return

    const fallback = rootRef.current?.querySelector<HTMLElement>(
      '[data-slot="file-upload-trigger"]:not(:disabled), [data-slot="file-upload-dropzone"]:not(:disabled)'
    )

    fallback?.focus()
  }, [disabled, focusRequest])

  React.useEffect(() => {
    const nextStatuses = new Map(
      value.map((item) => [item.id, item.status] as const)
    )
    const previousStatuses = previousStatusesRef.current

    previousStatusesRef.current = nextStatuses

    if (!previousStatuses) return

    const messages = value.flatMap((item) => {
      if (previousStatuses.get(item.id) === item.status) return []

      if (item.status === "success") {
        return [`${item.file.name} uploaded.`]
      }

      if (item.status === "error") {
        const reason = item.error
          ?.replace(/^upload failed\.?\s*/i, "")
          .trim()

        return [
          `${item.file.name} upload failed.${reason ? ` ${reason}` : ""}`,
        ]
      }

      return []
    })

    if (messages.length > 0) {
      announce(messages.join(" "))
    }
  }, [announce, value])

  const batchLimitMessage = React.useCallback(
    () =>
      `You can upload up to ${maxFiles} ${
        maxFiles === 1 ? "file" : "files"
      }. Remove a file before adding another.`,
    [maxFiles]
  )

  /** Rejects a whole batch, keeping whatever was already selected intact. */
  const rejectBatch = React.useCallback(
    (files: File[], message: string) => {
      const rejected = files.map((file) => ({
        id: createFileUploadId("rejected"),
        file,
        reason: message,
      }))

      setSelectionError(message)
      setRejections((current) => [...current, ...rejected])
      onReject?.(rejected)
      announce(message)
    },
    [announce, onReject]
  )

  /**
   * Single mode takes one file; extra files in the same gesture explain why
   * they were left out instead of disappearing.
   */
  const acceptSingleFile = React.useCallback(
    (files: File[]) => {
      const checks = { accept, minSize, maxSize, validateFile }
      const [first] = files
      let rejectionMessage: string | null = null

      if (!first) return

      const result = checkFileAgainstRules(first, checks)

      if (!result.valid) {
        rejectBatch([first], result.reason ?? "This file could not be added.")
        return
      }

      if (files.length > 1) {
        const extras = files.slice(1).map((file) => ({
          id: createFileUploadId("rejected"),
          file,
          reason: "Only one file can be added here. Replace the current selection.",
        }))

        setRejections((current) => [...current, ...extras])
        onReject?.(extras)
        rejectionMessage = describeRejections(extras)
      }

      const accepted = {
        id: createFileUploadId("file"),
        file: first,
        status: "pending" as const,
      }

      setValue([accepted])
      onAccept?.([accepted])
      announce(
        [`${first.name} added.`, rejectionMessage]
          .filter(Boolean)
          .join(" ")
      )
    },
    [accept, announce, maxSize, minSize, onAccept, onReject, rejectBatch, setValue, validateFile]
  )

  const acceptMultipleFiles = React.useCallback(
    (files: File[]) => {
      const checks = { accept, minSize, maxSize, validateFile }
      const accepted: FileUploadItem[] = []
      const rejected: FileUploadRejection[] = []

      for (const file of files) {
        const result = checkFileAgainstRules(file, checks)

        if (result.valid) {
          accepted.push({
            id: createFileUploadId("file"),
            file,
            status: "pending",
          })
        } else {
          rejected.push({
            id: createFileUploadId("rejected"),
            file,
            reason: result.reason ?? "This file could not be added.",
          })
        }
      }

      const rejectionMessage = describeRejections(rejected)

      if (rejected.length > 0) {
        setRejections((current) => [...current, ...rejected])
        onReject?.(rejected)
      }

      if (accepted.length === 0) {
        if (rejectionMessage) announce(rejectionMessage)
        return
      }

      setValue([...value, ...accepted])
      onAccept?.(accepted)
      const acceptedMessage =
        accepted.length === 1
          ? `${accepted[0].file.name} added.`
          : `${accepted.length} files added.`

      announce([acceptedMessage, rejectionMessage].filter(Boolean).join(" "))
    },
    [
      accept,
      announce,
      maxSize,
      minSize,
      onAccept,
      onReject,
      setValue,
      validateFile,
      value,
    ]
  )

  /** Shared entry point behind the picker, drops, and pastes. */
  const selectFiles = React.useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      const files = Array.from(incoming ?? [])

      setSelectionError(null)

      if (files.length === 0) return

      if (!multiple) {
        // Drops count as Replace here, matching the visible Replace action.
        acceptSingleFile(files)
        return
      }

      const remaining =
        maxFiles === undefined ? Number.POSITIVE_INFINITY : maxFiles - value.length

      if (remaining <= 0 || files.length > remaining) {
        // Whole batch stays out; partial acceptance hides the real limit.
        rejectBatch(files, batchLimitMessage())
        return
      }

      acceptMultipleFiles(files)
    },
    [
      acceptMultipleFiles,
      acceptSingleFile,
      batchLimitMessage,
      maxFiles,
      multiple,
      rejectBatch,
      value.length,
    ]
  )

  const removeItems = React.useCallback(
    (itemIds: string[], focusAfter = true) => {
      if (itemIds.length === 0) return

      const firstRemovedIndex = value.findIndex((entry) =>
        itemIds.includes(entry.id)
      )
      const nextValue = value.filter((entry) => !itemIds.includes(entry.id))

      setSelectionError(null)
      setValue(nextValue)

      for (const entry of value) {
        if (itemIds.includes(entry.id)) {
          onRemove?.(entry)
        }
      }

      if (focusAfter && itemIds.length === 1 && firstRemovedIndex >= 0) {
        const neighbor =
          nextValue[firstRemovedIndex] ?? nextValue[firstRemovedIndex - 1]

        requestFocus(
          neighbor
            ? { kind: "item-remove", itemId: neighbor.id }
            : { kind: "fallback" }
        )
      }
    },
    [onRemove, requestFocus, setValue, value]
  )

  const removeItem = React.useCallback(
    (itemId: string) => removeItems([itemId]),
    [removeItems]
  )

  const clearAll = React.useCallback(
    () => {
      removeItems(
        value.map((item) => item.id),
        false
      )
      requestFocus({ kind: "fallback" })
    },
    [removeItems, requestFocus, value]
  )

  const removeRejection = React.useCallback(
    (rejectionId: string) => {
      const removedIndex = rejections.findIndex(
        (entry) => entry.id === rejectionId
      )
      const nextRejections = rejections.filter(
        (entry) => entry.id !== rejectionId
      )
      const neighbor =
        nextRejections[removedIndex] ?? nextRejections[removedIndex - 1]

      setRejections(nextRejections)

      if (nextRejections.length === 0) {
        setSelectionError(null)
      }

      if (neighbor) {
        requestFocus({
          kind: "rejection-remove",
          rejectionId: neighbor.id,
        })
        return
      }

      const selectedItem = value.at(-1)

      requestFocus(
        selectedItem
          ? { kind: "item-remove", itemId: selectedItem.id }
          : { kind: "fallback" }
      )
    },
    [rejections, requestFocus, value]
  )

  const retryItem = React.useCallback(
    (item: FileUploadItem) => {
      onRetry?.(item)
    },
    [onRetry]
  )

  // Paste stays scoped to this uploader so other fields keep theirs.
  React.useEffect(() => {
    if (!allowPaste) return

    function handlePaste(event: ClipboardEvent) {
      if (!rootRef.current || disabled) return
      if (!rootRef.current.contains(document.activeElement)) return

      const files = event.clipboardData?.files

      if (files && files.length > 0) {
        event.preventDefault()
        selectFiles(files)
      }
    }

    document.addEventListener("paste", handlePaste)

    return () => document.removeEventListener("paste", handlePaste)
  }, [allowPaste, disabled, selectFiles])

  const controllerValue = React.useMemo<FileUploadControllerValue>(
    () => ({
      value,
      rejections,
      dragState,
      disabled,
      multiple,
      canAddMore,
      canRetry: onRetry !== undefined,
      selectionError,
      focusRequest,
      inputProps: {
        accept: toInputAcceptAttribute(accept),
        capture,
        multiple,
        ...(directory ? ({ webkitdirectory: "" } as const) : {}),
      },
      openPicker,
      activateFrom,
      removeItem,
      removeRejection,
      clearAll,
      retryItem,
      rememberDropzoneTrigger,
      requestFocus,
      beginDrag(draggedCount) {
        if (disabled) return

        dragDepthRef.current += 1
        const invalid = exceedsRemainingCapacity(draggedCount, value.length, {
          multiple,
          maxFiles,
        })

        setDragState(invalid ? "invalid" : "valid")

        if (invalid) {
          // Visible copy flips alongside; the region catches screen readers.
          announce(batchLimitMessage())
        }
      },
      refreshDragValidity(draggedCount) {
        if (disabled) return

        setDragState(
          exceedsRemainingCapacity(draggedCount, value.length, {
            multiple,
            maxFiles,
          })
            ? "invalid"
            : "valid"
        )
      },
      endDrag() {
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)

        if (dragDepthRef.current === 0) {
          setDragState("idle")
        }
      },
      cancelDrag() {
        dragDepthRef.current = 0
        setDragState("idle")
      },
      completeDrag(files) {
        dragDepthRef.current = 0
        setDragState("idle")
        selectFiles(files)
      },
      announce,
    }),
    [
      accept,
      activateFrom,
      announce,
      batchLimitMessage,
      canAddMore,
      capture,
      clearAll,
      directory,
      disabled,
      dragState,
      focusRequest,
      maxFiles,
      multiple,
      openPicker,
      onRetry,
      rejections,
      rememberDropzoneTrigger,
      removeItem,
      removeRejection,
      requestFocus,
      retryItem,
      selectFiles,
      selectionError,
      value,
    ]
  )

  return (
    <FileUploadControllerContext.Provider value={controllerValue}>
      <div
        ref={rootRef}
        data-slot="file-upload-root"
        data-disabled={disabled ? "" : undefined}
        className={cn("relative w-full min-w-0", className)}
        {...rootProps}
      >
        {children}
        <input
          ref={inputRef}
          {...controllerValue.inputProps}
          aria-hidden="true"
          tabIndex={-1}
          type="file"
          data-slot="file-upload-input"
          className="hidden"
          onChange={(event) => {
            selectFiles(event.target.files)
            event.target.value = ""

            const opener = openerRef.current

            if (opener?.isConnected) {
              opener.focus()
              openerRef.current = null
            }
          }}
        />
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    </FileUploadControllerContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Dropzone                                                                   */
/* -------------------------------------------------------------------------- */

export interface FileUploadDropzoneProps
  extends React.ComponentProps<"button"> {
  /** Styles the layout wrapper that also holds the selection error. */
  wrapperClassName?: string
}

/**
 * Clicking anywhere here opens the picker; Enter and Space do the same
 * through real button semantics. Child content joins the accessible name,
 * so keep the instruction inside rather than wiring extra labels.
 */
function FileUploadDropzone({
  className,
  wrapperClassName,
  children,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  disabled: disabledProp,
  "aria-describedby": describedByProp,
  ...props
}: FileUploadDropzoneProps) {
  const controller = useFileUploadController("FileUploadDropzone")
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const selectionErrorId = React.useId()
  const disabled = controller.disabled || disabledProp
  const describedBy = [
    describedByProp,
    controller.selectionError ? selectionErrorId : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined

  React.useEffect(() => {
    controller.rememberDropzoneTrigger(buttonRef.current)

    return () => controller.rememberDropzoneTrigger(null)
    // Registration follows mount/unmount; controller identity churn is noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (controller.focusRequest?.target.kind !== "dropzone") return
    if (disabled) return

    buttonRef.current?.focus()
  }, [controller.focusRequest, disabled])

  return (
    <div className={cn("w-full min-w-0", wrapperClassName)}>
      <button
        ref={buttonRef}
        type="button"
        {...props}
        data-slot="file-upload-dropzone"
        data-dragging={
          controller.dragState === "idle" ? undefined : controller.dragState
        }
        data-disabled={disabled ? "" : undefined}
        disabled={disabled}
        aria-describedby={describedBy}
        className={cn(
          "group/dropzone relative flex w-full cursor-pointer flex-col items-center justify-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border border-dashed bg-transparent px-[var(--hui-space-6)] py-[var(--hui-space-8)] text-center outline-none",
          "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
          "min-h-[132px] md:min-h-[176px]",
          "motion-safe:[transition:border-color_var(--hui-duration-fast)_var(--hui-ease-out),background-color_var(--hui-duration-fast)_var(--hui-ease-out)]",
          !disabled &&
            controller.dragState === "idle" && [
              "border-[var(--hui-color-border-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
              "hover:border-[var(--hui-color-border-base-emphasis)]",
              "focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:var(--hui-focus-ring-offset-accent)]",
            ],
          !disabled &&
            controller.dragState === "valid" && [
              "border-[var(--hui-color-border-accent-emphasis)] bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-color-foreground-accent-emphasis)]",
              "focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:var(--hui-focus-ring-offset-accent)]",
            ],
          !disabled &&
            controller.dragState === "invalid" && [
              "border-[var(--hui-color-border-danger-emphasis)] bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-emphasis)]",
              "focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:var(--hui-focus-ring-offset-accent)]",
            ],
          disabled && [
            "cursor-not-allowed border-[var(--hui-color-border-base-secondary)] text-[var(--hui-color-foreground-base-tertiary)]",
          ],
          className
        )}
        onDragEnter={(event) => {
          onDragEnter?.(event)
          if (event.defaultPrevented) return

          const fileCount = countDraggedFiles(event.dataTransfer)

          if (fileCount > 0) {
            event.preventDefault()
            controller.beginDrag(fileCount)
          }
        }}
        onDragOver={(event) => {
          onDragOver?.(event)
          if (event.defaultPrevented) return

          const fileCount = countDraggedFiles(event.dataTransfer)

          if (fileCount === 0) return

          event.preventDefault()
          event.dataTransfer.dropEffect =
            controller.dragState === "invalid" ? "none" : "copy"
          controller.refreshDragValidity(fileCount)
        }}
        onDragLeave={(event) => {
          onDragLeave?.(event)
          if (event.defaultPrevented) return

          controller.endDrag()
        }}
        onDrop={(event) => {
          onDrop?.(event)
          if (event.defaultPrevented) return

          const files = event.dataTransfer?.files

          controller.cancelDrag()

          if (!files || files.length === 0) return

          event.preventDefault()
          controller.completeDrag(files)
        }}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return

          controller.activateFrom(event.currentTarget)
        }}
      >
        <span className="contents">{children}</span>
      </button>

      {controller.selectionError ? (
        <p
          id={selectionErrorId}
          data-slot="file-upload-selection-error"
          className="mt-[var(--hui-space-2)] text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
        >
          {controller.selectionError}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Dropzone content                                                           */
/* -------------------------------------------------------------------------- */

export type FileUploadIconProps = React.ComponentProps<typeof UploadIcon>

/** Small upload arrow; tint follows the active drag state. */
function FileUploadIcon({ className, ...props }: FileUploadIconProps) {
  const controller = useFileUploadController("FileUploadIcon")

  return (
    <UploadIcon
      aria-hidden="true"
      data-slot="file-upload-icon"
      className={cn(
        "size-6 shrink-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:[transition:color_var(--hui-duration-fast)_var(--hui-ease-out)]",
        !controller.disabled &&
          controller.dragState === "valid" &&
          "text-[var(--hui-color-foreground-accent-emphasis)]",
        !controller.disabled &&
          controller.dragState === "invalid" &&
          "text-[var(--hui-color-foreground-danger-emphasis)]",
        controller.disabled && "text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Primary instruction line such as "Drop files here or click to browse".
 * Swap its wording during drags; color never carries that state alone.
 */
function FileUploadTitle({ className, ...props }: React.ComponentProps<"span">) {
  const controller = useFileUploadController("FileUploadTitle")

  return (
    <span
      data-slot="file-upload-title"
      data-dragging={
        controller.dragState === "idle" ? undefined : controller.dragState
      }
      className={cn(
        "block text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]",
        !controller.disabled &&
          controller.dragState === "valid" &&
          "text-[var(--hui-color-foreground-accent-emphasis)]",
        !controller.disabled &&
          controller.dragState === "invalid" &&
          "text-[var(--hui-color-foreground-danger-emphasis)]",
        controller.disabled && "text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
      {...props}
    />
  )
}

/** Muted requirements line such as "PNG, JPG, PDF up to 10 MB". */
function FileUploadDescription({ className, ...props }: React.ComponentProps<"span">) {
  const controller = useFileUploadController("FileUploadDescription")

  return (
    <span
      data-slot="file-upload-description"
      data-dragging={
        controller.dragState === "idle" ? undefined : controller.dragState
      }
      className={cn(
        "block text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
        !controller.disabled &&
          controller.dragState === "invalid" &&
          "text-[var(--hui-color-foreground-danger-primary)]",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Triggers and list-free actions                                             */
/* -------------------------------------------------------------------------- */

/**
 * Renders any action that opens the picker: Choose file, Replace, or
 * + Add more files. Disables itself once the limit makes adding dishonest.
 */
function FileUploadTrigger({
  render,
  children,
  ...props
}: useRender.ComponentProps<"button">) {
  const controller = useFileUploadController("FileUploadTrigger")

  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button"

  // Built outside the call so object freshness stops flagging custom attrs.
  const triggerDefaults = {
    "data-slot": "file-upload-trigger",
    type: typeValue,
    disabled: controller.disabled || !controller.canAddMore,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      controller.activateFrom(event.currentTarget)
    },
  }

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      triggerDefaults,
      // Spread keeps React from excess-checking against the render-fn arm.
      {
        ...props,
        children,
      }
    ),
  })
}

/**
 * Quiet "+ Add more files" action for lists that already hold something.
 * Children default to that phrasing; pass your own to match product voice.
 */
function FileUploadAddMore({
  children,
  ...props
}: Omit<useRender.ComponentProps<"button">, "render">) {
  return (
    <FileUploadTrigger render={<Button variant="outline" />} {...props}>
      <PlusIcon aria-hidden="true" />
      {children ?? "Add more files"}
    </FileUploadTrigger>
  )
}

/** Shows itself above one file; local selections stay easy to rebuild. */
function FileUploadClear({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const controller = useFileUploadController("FileUploadClear")

  if (controller.value.length <= 1 || controller.disabled) {
    return null
  }

  return (
    <Button
      variant="link"
      size="sm"
      className={className}
      onClick={() => {
        controller.clearAll()
      }}
      {...props}
    >
      Clear all
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export interface FileUploadListProps extends React.ComponentProps<"ul"> {
  /** Set false when file-type tiles fit the list better than image thumbnails. */
  showImagePreviews?: boolean
}

/** Selected rows plus recent rejections; absent when both collections are. */
function FileUploadList({
  className,
  showImagePreviews = true,
  ...props
}: FileUploadListProps) {
  const controller = useFileUploadController("FileUploadList")

  if (controller.value.length === 0 && controller.rejections.length === 0) {
    return null
  }

  return (
    <ul
      data-slot="file-upload-list"
      className={cn(
        "m-0 mt-[var(--hui-space-3)] w-full list-none rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] p-0",
        "[&>li+li]:border-t-[0.5px] [&>li+li]:border-t-[var(--hui-color-border-base-secondary)]",
        className
      )}
      {...props}
    >
      {controller.value.map((item) => (
        <FileUploadItem key={item.id} item={item}>
          <FileUploadItemPreview showImagePreview={showImagePreviews} />
          <FileUploadItemContent>
            <FileUploadItemName />
            <FileUploadItemMetadata />
            <FileUploadItemStatus />
            <FileUploadItemProgress />
          </FileUploadItemContent>
          <FileUploadItemActions>
            <FileUploadItemRetry />
            <FileUploadItemRemove />
          </FileUploadItemActions>
        </FileUploadItem>
      ))}
      {controller.rejections.map((rejection) => (
        <RejectedRow key={rejection.id} rejection={rejection} />
      ))}
    </ul>
  )
}

const FileUploadItemContext = React.createContext<FileUploadItem | null>(null)

function useFileUploadItem(componentName: string) {
  const item = React.useContext(FileUploadItemContext)

  if (!item) {
    throw new Error(`<${componentName}> must render inside <FileUploadItem>.`)
  }

  return item
}

export interface FileUploadItemProps extends React.ComponentProps<"li"> {
  item: FileUploadItem
}

function FileUploadItem({ item, className, children, ...props }: FileUploadItemProps) {
  return (
    <FileUploadItemContext.Provider value={item}>
      <li
        data-slot="file-upload-item"
        data-status={item.status}
        className={cn(
          "grid min-h-[64px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-[var(--hui-space-3)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
          className
        )}
        {...props}
      >
        {children}
      </li>
    </FileUploadItemContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Item parts                                                                 */
/* -------------------------------------------------------------------------- */

const previewTileClass =
  "flex size-10 shrink-0 flex-col items-center justify-center gap-y-0.5 rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-neutral-primary)] text-[var(--hui-color-foreground-base-secondary)]"

/**
 * Image files get live thumbnails; everything else gets a quiet type tile.
 * Object URLs revoke themselves when rows unmount. Images larger than 50 MB
 * skip the thumbnail so one drop cannot stall the page.
 */
export interface FileUploadItemPreviewProps
  extends Omit<React.ComponentProps<"img">, "src"> {
  src?: string
  /** Set false to render the file-type tile for images too. */
  showImagePreview?: boolean
}

function FileUploadItemPreview({
  className,
  src,
  showImagePreview = true,
  ...props
}: FileUploadItemPreviewProps) {
  const item = useFileUploadItem("FileUploadItemPreview")
  const generatedUrl = useImagePreviewUrl(item.file, showImagePreview)
  const previewUrl = showImagePreview ? (src ?? generatedUrl) : null

  if (!previewUrl) {
    return (
      <span aria-hidden="true" data-slot="file-upload-item-preview" className={previewTileClass}>
        <TileGlyph extension={getFileExtension(item.file.name)} />
      </span>
    )
  }

  return (
    /* The filename carries identity below; alt="" avoids repeating it. */
    // Blob URLs cannot go through next/image, and the registry installs this
    // component outside Next projects too.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      data-slot="file-upload-item-preview"
      src={previewUrl}
      className={cn(
        "size-10 shrink-0 rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] object-cover",
        className
      )}
      {...props}
    />
  )
}

function TileGlyph({ extension }: { extension: string }) {
  const glyphs: Record<string, React.ReactNode> = {
    PDF: <DocumentGlyph className="size-4" />,
    DOC: <DocumentGlyph className="size-4" />,
    DOCX: <DocumentGlyph className="size-4" />,
    TXT: <DocumentGlyph className="size-4" />,
    CSV: <SpreadsheetGlyph className="size-4" />,
    XLS: <SpreadsheetGlyph className="size-4" />,
    XLSX: <SpreadsheetGlyph className="size-4" />,
  }

  return (
    <>
      {glyphs[extension] ?? <FileGlyph className="size-4" />}
      {extension.length <= 5 ? (
        <span className="text-[calc(var(--hui-font-size-micro)*0.9)] font-medium leading-none tracking-wide">
          {extension}
        </span>
      ) : null}
    </>
  )
}

function useImagePreviewUrl(file: File, enabled: boolean) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // Object URLs are external browser resources that preview rows mirror into
  // state; the returned cleanup revokes them the moment rows leave.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (
      !enabled ||
      !file.type.startsWith("image/") ||
      file.size > 50 * 1024 * 1024
    ) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)

    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [enabled, file])
  /* eslint-enable react-hooks/set-state-in-effect */

  return previewUrl
}

export type FileUploadItemContentProps = FileUploadPartProps

function FileUploadItemContent({ className, ...props }: FileUploadItemContentProps) {
  return (
    <div
      data-slot="file-upload-item-content"
      className={cn(
        "col-start-2 flex min-w-0 flex-wrap items-baseline justify-between gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)]",
        "[&>[data-slot=file-upload-item-progress]]:basis-full [&>[data-slot=file-upload-item-reason]]:basis-full",
        className
      )}
      {...props}
    />
  )
}

export type FileUploadItemActionsProps = FileUploadPartProps

function FileUploadItemActions({
  className,
  ...props
}: FileUploadItemActionsProps) {
  return (
    <div
      data-slot="file-upload-item-actions"
      className={cn(
        "col-start-3 row-start-1 flex items-center gap-[var(--hui-space-1)]",
        className
      )}
      {...props}
    />
  )
}

function FileUploadItemName({ className, ...props }: React.ComponentProps<"span">) {
  const item = useFileUploadItem("FileUploadItemName")

  return (
    <span
      data-slot="file-upload-item-name"
      title={item.file.name}
      className={cn(
        "truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    >
      {item.file.name}
    </span>
  )
}

function FileUploadItemMetadata({ className, ...props }: React.ComponentProps<"span">) {
  const item = useFileUploadItem("FileUploadItemMetadata")
  const extension = getFileExtension(item.file.name)

  return (
    <span
      data-slot="file-upload-item-metadata"
      className={cn(
        "shrink-0 whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
        className
      )}
      {...props}
    >
      {[formatFileSize(item.file.size), extension].filter(Boolean).join(" · ")}
    </span>
  )
}

function statusTone(status: FileUploadStatus | undefined) {
  switch (status) {
    case "success":
      return "text-[var(--hui-color-foreground-success-primary)]"
    case "error":
      return "text-[var(--hui-color-foreground-danger-primary)]"
    default:
      return "text-[var(--hui-color-foreground-base-secondary)]"
  }
}

function FileUploadItemStatus({ className, ...props }: React.ComponentProps<"span">) {
  const item = useFileUploadItem("FileUploadItemStatus")

  return (
    <span
      data-slot="file-upload-item-status"
      className={cn(
        "inline-flex items-center gap-[var(--hui-space-2)] whitespace-nowrap [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
        statusTone(item.status),
        className
      )}
      {...props}
    >
      <StatusLine item={item} />
    </span>
  )
}

function StatusLine({ item }: { item: FileUploadItem }) {
  if (item.status === "uploading") {
    const percentKnown = typeof item.progress === "number"

    return (
      <>
        {!percentKnown && (
          <LoaderCircleIcon
            aria-hidden="true"
            className="size-3.5 motion-safe:animate-spin"
          />
        )}
        {percentKnown ? "Uploading" : "Uploading..."}
      </>
    )
  }

  if (item.status === "success") {
    return (
      <>
        <CircleCheckIcon aria-hidden="true" className="size-3.5" />
        Uploaded
      </>
    )
  }

  if (item.status === "error") {
    /* Applications own the sentence; show theirs verbatim. */
    return (
      <>
        <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
        {item.error ?? "Upload failed"}
      </>
    )
  }

  /* No lifecycle attached yet: stay quiet instead of promising an upload. */
  if (item.status === undefined) {
    return null
  }

  return "Waiting to upload"
}

/** Thin bar for running uploads; indeterminate while percent stays unknown. */
function FileUploadItemProgress({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Progress>, "value">) {
  const item = useFileUploadItem("FileUploadItemProgress")

  if (item.status !== "uploading") {
    return null
  }

  const percent =
    typeof item.progress === "number"
      ? Math.min(100, Math.max(0, item.progress))
      : null

  return (
    <div
      data-slot="file-upload-item-progress"
      className={cn(
        "flex w-full items-center gap-[var(--hui-space-3)] pt-[var(--hui-space-1)]",
        className
      )}
      {...props}
    >
      <Progress
        value={percent}
        aria-label={`Uploading ${item.file.name}`}
        className="gap-0"
      >
        <ProgressTrack className="h-[3px]">
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      {/* Percent reaches assistive tech through the progressbar itself. */}
      {percent !== null ? (
        <span
          aria-hidden="true"
          className="shrink-0 tabular-nums text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
        >
          {Math.round(percent)}%
        </span>
      ) : null}
    </div>
  )
}

/** Muted reason line under the filename; visible text beats tooltips. */
function FileUploadItemReason({ className, ...props }: React.ComponentProps<"span">) {
  const item = useFileUploadItem("FileUploadItemReason")

  if (!item.error) return null

  return (
    <span
      data-slot="file-upload-item-reason"
      className={cn(
        "text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]",
        className
      )}
      {...props}
    >
      {item.error}
    </span>
  )
}

/** Appears beside failed uploads only; your application owns the retry. */
function FileUploadItemRetry({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const item = useFileUploadItem("FileUploadItemRetry")
  const controller = useFileUploadController("FileUploadItemRetry")

  if (item.status !== "error" || !controller.canRetry) {
    return null
  }

  return (
    <Button
      {...props}
      variant="link"
      size="sm"
      disabled={controller.disabled}
      className={cn("-ms-[var(--hui-space-2)] h-fit shrink-0 self-center", className)}
      onClick={() => {
        controller.retryItem(item)
      }}
    >
      {children ?? "Retry"}
    </Button>
  )
}

export interface FileUploadItemRemoveProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "aria-label"> {
  /** Overrides the generated "Remove {name}" accessible label. */
  "aria-label"?: string
  onClick?: never
}

/** Icon control normally; swaps to plain Remove text beside Retry on error. */
function FileUploadItemRemove({
  className,
  ...props
}: FileUploadItemRemoveProps) {
  const item = useFileUploadItem("FileUploadItemRemove")
  const controller = useFileUploadController("FileUploadItemRemove")
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const failed = item.status === "error"

  React.useEffect(() => {
    if (
      controller.focusRequest?.target.kind === "item-remove" &&
      controller.focusRequest.target.itemId === item.id
    ) {
      buttonRef.current?.focus()
    }
  }, [controller.focusRequest, item.id])

  return (
    <Button
      ref={buttonRef}
      {...props}
      variant={failed ? "link" : "ghost"}
      size={failed ? "sm" : "icon-sm"}
      disabled={controller.disabled}
      aria-label={props["aria-label"] ?? `Remove ${item.file.name}`}
      className={cn(
        failed && "-ms-[var(--hui-space-2)] h-fit shrink-0 self-center",
        "max-sm:size-8",
        className
      )}
      onClick={() => {
        controller.removeItem(item.id)
      }}
    >
      {failed ? "Remove" : <CloseIcon aria-hidden="true" />}
    </Button>
  )
}

/** Rejected rows stay listed with their reason until someone removes them. */
function RejectedRow({ rejection }: { rejection: FileUploadRejection }) {
  const controller = useFileUploadController("FileUploadRejectedRow")
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (
      controller.focusRequest?.target.kind === "rejection-remove" &&
      controller.focusRequest.target.rejectionId === rejection.id
    ) {
      buttonRef.current?.focus()
    }
  }, [controller.focusRequest, rejection.id])

  return (
    <li
      data-slot="file-upload-rejected-row"
      className="grid min-h-[64px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-[var(--hui-space-3)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]"
    >
      <span
        aria-hidden="true"
        className={cn(
          previewTileClass,
          "border-[var(--hui-color-border-danger-emphasis)] bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-primary)]"
        )}
      >
        <TriangleAlertIcon className="size-4" />
      </span>
      <div className="col-start-2 flex min-w-0 flex-col gap-y-[var(--hui-space-1)]">
        <span
          title={rejection.file.name}
          className="truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
        >
          {rejection.file.name}
        </span>
        <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          {[formatFileSize(rejection.file.size), getFileExtension(rejection.file.name)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          {rejection.reason}
        </span>
      </div>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon-sm"
        disabled={controller.disabled}
        aria-label={`Remove ${rejection.file.name}`}
        className="max-sm:size-8"
        onClick={() => {
          controller.removeRejection(rejection.id)
        }}
      >
        <CloseIcon aria-hidden="true" />
      </Button>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Trigger companions                                                         */
/* -------------------------------------------------------------------------- */

/** Muted "report.pdf · 2.4 MB" summary next to button-only layouts. */
function FileUploadSummary({ className }: { className?: string }) {
  const controller = useFileUploadController("FileUploadSummary")

  return (
    <span
      data-slot="file-upload-summary"
      className={cn(
        "truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
    >
      {controller.value.length === 0
        ? "No file chosen"
        : controller.value
            .map((item) =>
              [item.file.name, formatFileSize(item.file.size)]
                .filter(Boolean)
                .join(" · ")
            )
            .join(", ")}
    </span>
  )
}

export {
  FileUpload,
  FileUploadAddMore,
  FileUploadClear,
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadIcon,
  FileUploadItem,
  FileUploadItemActions,
  FileUploadItemContent,
  FileUploadItemMetadata,
  FileUploadItemName,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadItemReason,
  FileUploadItemRemove,
  FileUploadItemRetry,
  FileUploadItemStatus,
  FileUploadList,
  FileUploadSummary,
  FileUploadTitle,
  FileUploadTrigger,
}
