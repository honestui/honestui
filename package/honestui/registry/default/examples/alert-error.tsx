"use client"

import * as React from "react"
import { CircleAlert as CircleAlertIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function AlertError() {
  const [url, setUrl] = React.useState("example.com/webhook")
  const [connected, setConnected] = React.useState(false)

  const isValid = url.startsWith("https://")

  return (
    <Form
      className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        setConnected(isValid)
      }}
    >
      <div className="space-y-1">
        <h3 className="font-medium">Webhook endpoint</h3>
        <p className="text-sm text-muted-foreground">
          Send workspace events to your server.
        </p>
      </div>
      <Field invalid={!isValid}>
        <FieldLabel>Endpoint URL</FieldLabel>
        <FieldControl
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setConnected(false)
          }}
          aria-describedby="webhook-status"
        />
      </Field>
      <Alert variant={connected ? "success" : "error"} id="webhook-status">
        <CircleAlertIcon />
        <AlertTitle>
          {connected ? "Webhook connected" : "Connection failed"}
        </AlertTitle>
        <AlertDescription>
          {connected
            ? "The endpoint is ready to receive workspace events."
            : "Enter a secure URL that starts with https://, then try again."}
        </AlertDescription>
      </Alert>
      <Button type="submit">
        {connected ? "Test again" : "Test connection"}
      </Button>
    </Form>
  )
}
