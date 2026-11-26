"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/default/ui/drawer"

const ACTIONS = ["Share link", "Duplicate", "Move to folder"]

export default function DrawerActionSheet() {
  const [result, setResult] = React.useState("")

  return (
    <div className="flex flex-col items-center gap-[var(--hui-space-3)]">
      <Drawer>
        <DrawerTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Photo options
            </Button>
          )}
        />
        <DrawerPopup className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>IMG_2041.jpg</DrawerTitle>
            <DrawerDescription>Taken Oct 12 · 4.2 MB</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-[var(--hui-space-2)] px-4">
            {ACTIONS.map((action) => (
              <DrawerClose
                key={action}
                onClick={() => setResult(`${action} selected.`)}
                render={(props) => (
                  <Button {...props} variant="secondary" size="lg" className="w-full">
                    {action}
                  </Button>
                )}
              />
            ))}
          </div>
          {/* The destructive action is separated so a sloppy tap on the
              list above can never reach it. */}
          <div className="flex flex-col gap-[var(--hui-space-2)] p-4">
            <DrawerClose
              onClick={() => setResult("Photo moved to Recently deleted.")}
              render={(props) => (
                <Button {...props} variant="destructive-outline" size="lg" className="w-full">
                  Delete photo
                </Button>
              )}
            />
            <DrawerClose
              render={(props) => (
                <Button {...props} variant="ghost" size="lg" className="w-full">
                  Cancel
                </Button>
              )}
            />
          </div>
        </DrawerPopup>
      </Drawer>
      <p
        aria-live="polite"
        className="m-0 min-h-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {result}
      </p>
    </div>
  )
}
