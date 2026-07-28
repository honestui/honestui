"use client"

import { Button } from "@/registry/default/ui/button"
import { toastManager } from "@/registry/default/ui/toast"

export default function GooeyToastPromise() {
  const handlePromise = () => {
    const promise = new Promise<{ name: string }>((resolve) => {
      setTimeout(() => resolve({ name: "User" }), 2000)
    })

    toastManager.promise(promise, {
      variant: "gooey",
      loading: { title: "Loading..." },
      success: (data) => ({
        title: "Success!",
        description: `Welcome back, ${data.name}!`,
      }),
      error: {
        title: "Error",
        description: "Failed to load data.",
      },
    })
  }

  return (
    <Button variant="outline" onClick={handlePromise}>
      Load Data
    </Button>
  )
}
