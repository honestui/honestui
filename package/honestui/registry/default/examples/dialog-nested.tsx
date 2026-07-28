import { Button } from "@/registry/default/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"

export default function DialogNestedDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open parent
      </DialogTrigger>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Manage team member</DialogTitle>
          <DialogDescription>
            View and manage a user in your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-sm font-medium">Connor Love</p>
          </div>
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium">loveconnor2005@gmail.com</p>
          </div>
        </div>
        <DialogFooter>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Edit details
            </DialogTrigger>
            <DialogPopup showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Edit details</DialogTitle>
                <DialogDescription>
                  Make changes to the member&apos;s information.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <FieldControl type="text" defaultValue="Connor Love" />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldControl type="text" defaultValue="loveconnor2005@gmail.com" />
                </Field>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
