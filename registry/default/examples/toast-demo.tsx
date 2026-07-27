"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function ToastDemo() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        toastManager.add({
          title: "Event has been created",
          description: "Monday, January 3rd at 6:00pm",
        })
      }}
    >
      Default Toast
    </Button>
  )
}
