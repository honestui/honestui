"use client"

import * as React from "react"

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AlertDialogDemo() {
  const [deleted, setDeleted] = React.useState(false)
  const resultRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (deleted) resultRef.current?.focus()
  }, [deleted])

  if (deleted) {
    return (
      <Alert
        ref={resultRef}
        tabIndex={-1}
        variant="success"
        className="max-w-sm outline-none focus-visible:[outline:var(--hui-focus-ring)]"
      >
        <AlertTitle>Workspace deleted</AlertTitle>
        <AlertDescription>
          The Design workspace and its sample data were removed.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <section className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h3 className="font-medium">Delete workspace</h3>
        <p className="text-sm text-muted-foreground">
          Permanently remove the Design workspace and its data.
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
          Delete Design workspace
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design workspace?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription>
              This permanently deletes the workspace and its sample data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Keep workspace
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={() => setDeleted(true)}
                />
              }
            >
              Delete workspace
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </section>
  )
}
