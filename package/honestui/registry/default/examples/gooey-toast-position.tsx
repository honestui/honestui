"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager, type ToastPosition } from "@/registry/default/ui/toast"

export default function GooeyToastPosition() {
  const positions: ToastPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {positions.map((position) => (
        <Button
          key={position}
          variant="outline"
          onClick={() => {
            toastManager.add({
              variant: "gooey",
              title: position,
              description: `Toast shown at ${position}`,
              position,
            })
          }}
        >
          {position}
        </Button>
      ))}
    </div>
  )
}
