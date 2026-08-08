"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog"
import { Field } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import { Textarea } from "@/registry/default/ui/textarea"

export default function DialogCloseConfirmationDemo() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(o) => {
        if (!o && value) {
          setConfirmOpen(true)
        } else {
          setDialogOpen(o)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Compose
      </DialogTrigger>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Type something and try closing.
          </DialogDescription>
        </DialogHeader>
        <Form
          className="grid"
          onSubmit={(event) => {
            event.preventDefault()
            // Close the dialog when submitting
            setDialogOpen(false)
          }}
        >
          <DialogBody>
            <Field>
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                setValue("")
                setDialogOpen(false)
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription>
              Your message will be lost.
            </AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Go back
            </AlertDialogClose>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                setValue("")
                setDialogOpen(false)
              }}
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Dialog>
  )
}
