import type { FileUploadAccept } from "./file-upload-types"

let idCounter = 0

/** Stable ids without assuming crypto.randomUUID support. */
export function createFileUploadId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  idCounter += 1

  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

const KB = 1024
const MB = 1024 * 1024

/** Compact human size: 820 KB, 1.4 MB, 2 GB. Binary units, one decimal. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return ""
  }

  const formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })

  if (bytes < KB) {
    return `${bytes} B`
  }

  if (bytes < MB) {
    return `${formatter.format(bytes / KB)} KB`
  }

  const gb = bytes / MB / 1024

  return gb >= 1 ? `${formatter.format(gb)} GB` : `${formatter.format(bytes / MB)} MB`
}

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".")

  if (dot <= 0 || dot === fileName.length - 1) {
    return ""
  }

  return fileName.slice(dot + 1).toUpperCase()
}

interface NormalizedAccept {
  mimeTypes: Set<string>
  wildcards: string[]
  extensions: Set<string>
}

function normalizeAccept(accept?: FileUploadAccept | undefined): NormalizedAccept | null {
  if (!accept) {
    return null
  }

  const tokens =
    typeof accept === "string"
      ? accept.split(",").map((token) => token.trim())
      : Object.entries(accept).flatMap(([mimeType, extensions]) => [
          mimeType,
          ...extensions.map((extension) => extension.trim()),
        ])

  const normalized: NormalizedAccept = {
    mimeTypes: new Set(),
    wildcards: [],
    extensions: new Set(),
  }

  for (const token of tokens) {
    if (!token) continue

    if (token.startsWith(".")) {
      normalized.extensions.add(token.slice(1).toLowerCase())
    } else if (token.endsWith("/*")) {
      normalized.wildcards.push(token.slice(0, -2).toLowerCase())
    } else {
      normalized.mimeTypes.add(token.toLowerCase())
    }
  }

  return normalized
}

/** Format aliases collapse in prose so reasons read "JPG", not "JPEG or JPG". */
const extensionDisplayAliases: Record<string, string> = {
  jpeg: "jpg",
  tiff: "tif",
  html: "htm",
}

/** Human list built from an accept record, e.g. "PNG, JPG, or PDF". */
export function describeAcceptedTypes(
  accept?: FileUploadAccept | undefined,
): string | null {
  if (!accept) {
    return null
  }

  const labels: string[] = []

  if (typeof accept !== "string") {
    for (const extensions of Object.values(accept)) {
      labels.push(...extensions)
    }
  } else {
    labels.push(...accept.split(",").map((token) => token.trim()))
  }

  const unique = [
    ...new Set(
      labels
        .filter(Boolean)
        .map((label) => label.replace(/^\./, "").toLowerCase())
        .map((label) => extensionDisplayAliases[label] ?? label)
        .map((label) => label.toUpperCase()),
    ),
  ]

  if (unique.length === 0) {
    return null
  }

  if (unique.length === 1) {
    return unique[0]
  }

  if (unique.length === 2) {
    return `${unique[0]} or ${unique[1]}`
  }

  return `${unique.slice(0, -1).join(", ")}, or ${unique[unique.length - 1]}`
}

export function isFileAccepted(file: File, accept?: FileUploadAccept | undefined) {
  const normalized = normalizeAccept(accept)

  if (!normalized) {
    return true
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
    : ""

  if (extension && normalized.extensions.has(extension)) {
    return true
  }

  const mimeType = file.type.toLowerCase()

  if (normalized.mimeTypes.has(mimeType)) {
    return true
  }

  return normalized.wildcards.some((prefix) => mimeType.startsWith(`${prefix}/`))
}

export interface FileUploadRuleCheckResult {
  valid: boolean
  reason?: string
}

export interface FileUploadRuleChecks {
  accept?: FileUploadAccept | undefined
  minSize?: number | undefined
  maxSize?: number | undefined
  validateFile?: ((file: File) => string | null) | undefined
}

/**
 * Per-file rules only. File-count limits are selection-level decisions the
 * root owns, because they depend on what has already been chosen.
 */
export function checkFileAgainstRules(
  file: File,
  checks: FileUploadRuleChecks,
): FileUploadRuleCheckResult {
  if (file.size === 0) {
    return { valid: false, reason: "This file is empty." }
  }

  if (checks.minSize !== undefined && checks.minSize > 0 && file.size < checks.minSize) {
    return {
      valid: false,
      reason: `This file is too small. Minimum size is ${formatFileSize(checks.minSize)}.`,
    }
  }

  if (checks.maxSize !== undefined && file.size > checks.maxSize) {
    return {
      valid: false,
      reason: `File is too large. Maximum is ${formatFileSize(checks.maxSize)}.`,
    }
  }

  if (!isFileAccepted(file, checks.accept)) {
    const allowed = describeAcceptedTypes(checks.accept)

    return {
      valid: false,
      reason: allowed
        ? `File type is not supported. Choose ${allowed}.`
        : "File type is not supported.",
    }
  }

  const custom = checks.validateFile?.(file)

  if (custom) {
    return { valid: false, reason: custom }
  }

  return { valid: true }
}

/**
 * HTML accept attribute for the hidden input. A record keeps its extension
 * pairs so pickers offer the right filter; strings pass through untouched.
 */
export function toInputAcceptAttribute(accept?: FileUploadAccept | undefined) {
  if (!accept) {
    return undefined
  }

  if (typeof accept === "string") {
    return accept
  }

  return Object.entries(accept)
    .map(([mimeType, extensions]) => [mimeType, ...extensions].join(","))
    .join(",")
}
