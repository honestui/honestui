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
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>
        Open Dialog
      </DialogTrigger>
      <DialogPopup className="sm:max-w-sm">
        <Form className="grid">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldControl type="text" defaultValue="Connor Love" />
            </Field>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <FieldControl type="text" defaultValue="@loveconnor" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}
