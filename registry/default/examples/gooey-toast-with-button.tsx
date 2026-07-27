"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function GooeyToastWithButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const id = toastManager.add({
          variant: "gooey",
          type: "action",
          title: "File deleted",
          description: "Your file has been moved to trash.",
          button: {
            title: "Undo",
            onClick: () => {
              toastManager.close(id)
              toastManager.add({
                variant: "gooey",
                type: "success",
                title: "Restored",
                description: "Your file has been restored.",
              })
            },
          },
        })
      }}
    >
      Delete File
    </Button>
  )
}
