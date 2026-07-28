import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Sheet, SheetFooter, SheetHeader, SheetPopup, SheetTitle, SheetTrigger } from "@/registry/default/ui/sheet"

export default function SheetProfileEditor() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Edit profile</SheetTrigger>
      <SheetPopup>
        <SheetHeader><SheetTitle>Profile</SheetTitle></SheetHeader>
        <div className="grid gap-4 px-4">
          <Field><FieldLabel>Name</FieldLabel><FieldControl defaultValue="Alex Morgan" /></Field>
          <Field><FieldLabel>Role</FieldLabel><FieldControl defaultValue="Designer" /></Field>
        </div>
        <SheetFooter><Button>Save changes</Button></SheetFooter>
      </SheetPopup>
    </Sheet>
  )
}
