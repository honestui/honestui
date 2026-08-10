"use client"

import * as React from "react"
import { CircleCheck as CircleCheckIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function AlertSuccess() {
  const [saved, setSaved] = React.useState(true)

  return (
    <Form
      className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(true)
      }}
    >
      <div className="space-y-1">
        <h3 className="font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This name appears to everyone in your workspace.
        </p>
      </div>
      <Field>
        <FieldLabel>Display name</FieldLabel>
        <FieldControl
          defaultValue="Alex Morgan"
          onChange={() => setSaved(false)}
        />
      </Field>
      {saved && (
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertTitle>Profile saved</AlertTitle>
          <AlertDescription>
            Your updated name is now visible across the workspace.
          </AlertDescription>
        </Alert>
      )}
      <Button
        type={saved ? "button" : "submit"}
        onClick={saved ? () => setSaved(false) : undefined}
      >
        {saved ? "Edit profile" : "Save changes"}
      </Button>
    </Form>
  )
}
