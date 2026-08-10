"use client"

import * as React from "react"
import { TriangleAlert as TriangleAlertIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AlertWarning() {
  const [updated, setUpdated] = React.useState(false)

  return (
    <section className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h3 className="font-medium">Payment method</h3>
        <p className="text-sm text-muted-foreground">
          Visa ending in 4242 · Expires this month
        </p>
      </div>
      <Alert variant={updated ? "success" : "warning"}>
        <TriangleAlertIcon />
        <AlertTitle>
          {updated ? "Payment method updated" : "Card expires soon"}
        </AlertTitle>
        <AlertDescription>
          {updated
            ? "Future invoices will use the replacement card."
            : "Replace this card before your next invoice to avoid an interrupted subscription."}
        </AlertDescription>
      </Alert>
      <Button onClick={() => setUpdated((current) => !current)}>
        {updated ? "Reset example" : "Replace card"}
      </Button>
    </section>
  )
}
