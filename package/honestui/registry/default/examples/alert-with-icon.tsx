"use client"

import * as React from "react"
import { Info as InfoIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AlertWithIcon() {
  const [generated, setGenerated] = React.useState(false)

  return (
    <section className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h3 className="font-medium">Recovery codes</h3>
        <p className="text-sm text-muted-foreground">
          Use a recovery code if you lose access to your authenticator.
        </p>
      </div>
      <Alert>
        <InfoIcon />
        <AlertTitle>
          {generated ? "New codes are ready" : "Keep your codes private"}
        </AlertTitle>
        <AlertDescription>
          {generated
            ? "Your previous codes no longer work. Store the new set somewhere safe."
            : "Generating a new set will invalidate every code you saved before."}
        </AlertDescription>
      </Alert>
      <Button onClick={() => setGenerated((current) => !current)}>
        {generated ? "Generate another set" : "Generate new codes"}
      </Button>
    </section>
  )
}
