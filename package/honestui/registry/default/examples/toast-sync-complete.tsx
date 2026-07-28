"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function ToastSyncComplete() {
  return (
    <Button
      variant="outline"
      onClick={() => toastManager.add({ title: "Synced", description: "All local changes are backed up." })}
    >
      Show sync toast
    </Button>
  )
}
