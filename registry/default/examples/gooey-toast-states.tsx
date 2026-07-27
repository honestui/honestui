"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function GooeyToastStates() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "success",
            title: "Success!",
            description: "Your changes have been saved.",
          })
        }}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "error",
            title: "Error",
            description: "Something went wrong. Please try again.",
          })
        }}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "warning",
            title: "Warning",
            description: "This action cannot be undone.",
          })
        }}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "info",
            title: "Did you know?",
            description: "You can customize toast animations.",
          })
        }}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toastManager.add({
            variant: "gooey",
            type: "action",
            title: "Action Required",
            description: "Please review your settings.",
          })
        }}
      >
        Action
      </Button>
    </div>
  )
}
