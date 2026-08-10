"use client"

import * as React from "react"
import { Info as InfoIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function AlertInfo() {
  const [ready, setReady] = React.useState(false)

  return (
    <Form
      className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        setReady(true)
      }}
    >
      <div className="space-y-1">
        <h3 className="font-medium">Billing address</h3>
        <p className="text-sm text-muted-foreground">
          Used for invoices and tax calculations.
        </p>
      </div>
      <Alert variant={ready ? "success" : "info"}>
        <InfoIcon />
        <AlertTitle>
          {ready
            ? "Address ready for review"
            : "Use the address on your payment method"}
        </AlertTitle>
        <AlertDescription>
          {ready
            ? "Check the address and total on the next step before you pay."
            : "A mismatch may cause your bank to decline the payment."}
        </AlertDescription>
      </Alert>
      <Field>
        <FieldLabel>Postal code</FieldLabel>
        <FieldControl name="postal-code" autoComplete="postal-code" />
      </Field>
      <Button
        type={ready ? "button" : "submit"}
        onClick={ready ? () => setReady(false) : undefined}
      >
        {ready ? "Edit address" : "Continue to review"}
      </Button>
    </Form>
  )
}
