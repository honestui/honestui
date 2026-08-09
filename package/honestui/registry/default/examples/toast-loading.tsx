"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function ToastLoading() {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toastManager.add({
          title: "Loading…",
          description: "Please wait while we process your request.",
          type: "loading",
        })
      }}
    >
      Loading Toast
    </Button>
  )
}
