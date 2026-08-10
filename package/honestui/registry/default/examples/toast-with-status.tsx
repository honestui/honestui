"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function ToastWithStatus() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            title: "Changes saved",
            description: "Your notification settings are up to date.",
            type: "success",
          })
        }}
      >
        Show success
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            title: "Invitation not sent",
            description: "Check the email address, then try again.",
            type: "error",
          })
        }}
      >
        Show error
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            title: "Component copied",
            description: "Review the new source file before committing it.",
            type: "info",
          })
        }}
      >
        Show information
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            title: "Session expires in 5 minutes",
            description: "Save your work to avoid losing unsaved changes.",
            type: "warning",
          })
        }}
      >
        Show warning
      </Button>
    </div>
  )
}
