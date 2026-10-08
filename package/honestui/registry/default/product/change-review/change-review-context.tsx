"use client"

import * as React from "react"

import type { ChangeReviewControllerValue } from "./change-review-types"

export const ChangeReviewControllerContext =
  React.createContext<ChangeReviewControllerValue | null>(null)

ChangeReviewControllerContext.displayName = "ChangeReviewControllerContext"

export function useChangeReviewController(componentName: string): ChangeReviewControllerValue {
  const controller = React.useContext(ChangeReviewControllerContext)

  if (!controller) {
    throw new Error(
      `<${componentName}> must be rendered inside <ChangeReview> so it can read the changes.`
    )
  }

  return controller
}
