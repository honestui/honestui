import { describe, expect, it } from "vitest"

import {
  checkFileAgainstRules,
  describeAcceptedTypes,
  formatFileSize,
  isFileAccepted,
  toInputAcceptAttribute,
} from "../../registry/default/product/file-upload/file-upload-utils"

const imageTypes = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
}

describe("file upload utilities", () => {
  it("formats byte boundaries for row metadata and rule messages", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB")
    expect(formatFileSize(-1)).toBe("")
  })

  it("builds picker and human-readable accept values", () => {
    expect(toInputAcceptAttribute(imageTypes)).toBe(
      "image/png,.png,image/jpeg,.jpg,.jpeg"
    )
    expect(describeAcceptedTypes(imageTypes)).toBe("PNG or JPG")
  })

  it("accepts a file when either its extension or reported MIME type matches", () => {
    expect(
      isFileAccepted(
        new File(["photo"], "photo.png", { type: "application/octet-stream" }),
        imageTypes
      )
    ).toBe(true)
    expect(
      isFileAccepted(
        new File(["photo"], "photo.bin", { type: "image/jpeg" }),
        imageTypes
      )
    ).toBe(true)
    expect(
      isFileAccepted(
        new File(["text"], "notes.txt", { type: "text/plain" }),
        imageTypes
      )
    ).toBe(false)
  })

  it("checks empty, size, type, and custom rules in order", () => {
    const checks = {
      accept: imageTypes,
      minSize: 2,
      maxSize: 4,
      validateFile: () => "The image dimensions are too small.",
    }

    expect(checkFileAgainstRules(new File([], "empty.png"), checks)).toEqual({
      valid: false,
      reason: "This file is empty.",
    })
    expect(
      checkFileAgainstRules(new File(["a"], "small.png"), checks)
    ).toEqual({
      valid: false,
      reason: "This file is too small. Minimum size is 2 B.",
    })
    expect(
      checkFileAgainstRules(new File(["12345"], "large.png"), checks)
    ).toEqual({
      valid: false,
      reason: "File is too large. Maximum is 4 B.",
    })
    expect(
      checkFileAgainstRules(new File(["123"], "notes.txt"), checks)
    ).toEqual({
      valid: false,
      reason: "File type is not supported. Choose PNG or JPG.",
    })
    expect(
      checkFileAgainstRules(new File(["123"], "photo.png"), checks)
    ).toEqual({
      valid: false,
      reason: "The image dimensions are too small.",
    })
  })
})
