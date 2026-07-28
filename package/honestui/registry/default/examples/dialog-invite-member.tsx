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

export default function DialogInviteMember() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Invite member</DialogTrigger>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>Send an invitation to collaborate in this workspace.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldControl type="email" placeholder="name@company.com" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button>Send invite</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
