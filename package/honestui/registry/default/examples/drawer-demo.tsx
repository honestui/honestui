"use client"

import { Button } from "@/registry/default/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/default/ui/drawer"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Add payment method
          </Button>
        )}
      />
      <DrawerPopup>
        <Form
          className="mx-auto flex w-full max-w-md flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <DrawerHeader>
            <DrawerTitle>Add a card</DrawerTitle>
            <DrawerDescription>
              Swipe down or press Escape to dismiss without saving.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4">
            <Field>
              <FieldLabel>Name on card</FieldLabel>
              <FieldControl autoComplete="cc-name" defaultValue="Ada Lovelace" />
            </Field>
            <Field>
              <FieldLabel>Card number</FieldLabel>
              <FieldControl
                autoComplete="cc-number"
                inputMode="numeric"
                placeholder="1234 1234 1234 1234"
              />
            </Field>
          </div>
          <DrawerFooter>
            <Button type="submit">Save card</Button>
            <DrawerClose
              render={(props) => (
                <Button {...props} variant="ghost">
                  Cancel
                </Button>
              )}
            />
          </DrawerFooter>
        </Form>
      </DrawerPopup>
    </Drawer>
  )
}
