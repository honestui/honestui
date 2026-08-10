"use client"

import { useEffect, useState } from "react"
import { LoaderCircle as LoaderCircleIcon } from "honestui/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

export default function AvatarLoading() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setLoading((prev) => !prev), 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <Avatar>
        <AvatarImage src="https://github.com/loveconnor.png" alt="@honest-ui" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
          <LoaderCircleIcon className="size-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
