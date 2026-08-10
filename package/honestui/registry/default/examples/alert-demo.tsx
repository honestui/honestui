"use client"

import * as React from "react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function AlertDemo() {
  const [email, setEmail] = React.useState("alex@example.com")
  const [sentTo, setSentTo] = React.useState<string | null>(null)

  return (
    <Form
      className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        setSentTo(email)
      }}
    >
      <div className="space-y-1">
        <h3 className="font-medium">Invite a teammate</h3>
        <p className="text-sm text-muted-foreground">
          They will join the Design workspace as a member.
        </p>
      </div>
      <Field>
        <FieldLabel>Work email</FieldLabel>
        <FieldControl
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setSentTo(null)
          }}
          required
        />
      </Field>
      <Alert variant={sentTo ? "success" : "default"}>
        <AlertTitle>{sentTo ? "Invite sent" : "Before you invite"}</AlertTitle>
        <AlertDescription>
          {sentTo
            ? `${sentTo} can now join from the email invitation.`
            : "Invitations expire after seven days. You can revoke one at any time."}
        </AlertDescription>
      </Alert>
      <Button type="submit">{sentTo ? "Resend invite" : "Send invite"}</Button>
    </Form>
  )
}
