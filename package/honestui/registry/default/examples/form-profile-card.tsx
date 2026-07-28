import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function FormProfileCard() {
  return (
    <Form className="grid w-full max-w-xs gap-4 rounded-xl border p-4">
      <Field><FieldLabel>Display name</FieldLabel><FieldControl defaultValue="Sam Rivera" /></Field>
      <Field><FieldLabel>Email</FieldLabel><FieldControl type="email" defaultValue="sam@example.com" /></Field>
      <Button type="submit">Save profile</Button>
    </Form>
  )
}
