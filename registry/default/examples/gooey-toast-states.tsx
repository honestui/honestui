"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function GooeyToastStates() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "success",
            title: "Profile saved",
            description: "Your updated name is now visible to workspace members.",
          })
        }}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "error",
            title: "Upload failed",
            description: "The file is larger than 10 MB. Choose a smaller file and try again.",
          })
        }}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "warning",
            title: "Storage nearly full",
            description: "2 GB remains in this workspace.",
          })
        }}
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "info",
            title: "Keyboard shortcut available",
            description: "Press Command and K to open search.",
          })
        }}
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "action",
            title: "Review sign-in methods",
            description: "A new sign-in method was added to this account.",
          })
        }}
      >
        Action
      </Button>
    </div>
  )
}
