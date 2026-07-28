"use client"

import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/registry/default/ui/sheet"

export default function DialogDemo() {
  return (
    <Sheet>
      <SheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Open Sheet
          </Button>
        )}
      />
      <SheetPopup>
        <Form className="grid gap-4">
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when
              you&apos;re done.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldControl type="text" defaultValue="Connor Love" />
            </Field>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <FieldControl type="text" defaultValue="@loveconnor" />
            </Field>
          </div>
          <SheetFooter>
            <SheetClose
              render={(props) => (
                <Button {...props} variant="ghost">
                  Cancel
                </Button>
              )}
            />
            <Button type="submit">Save</Button>
          </SheetFooter>
        </Form>
      </SheetPopup>
    </Sheet>
  )
}
