"use client"

import * as React from "react"
import {
  CircleCheck as CircleCheckIcon,
  Info as InfoIcon,
  TriangleAlert as TriangleAlertIcon,
} from "honestui/icons"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AlertWithIconAction() {
  const [status, setStatus] = React.useState<"review" | "later" | "secured">(
    "review"
  )
  const StatusIcon =
    status === "secured"
      ? CircleCheckIcon
      : status === "later"
        ? TriangleAlertIcon
        : InfoIcon

  return (
    <section className="grid w-full max-w-lg gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-medium">Account security</h3>
          <p className="text-sm text-muted-foreground">Two-step verification</p>
        </div>
        <span className="text-sm font-medium">
          {status === "secured" ? "On" : "Off"}
        </span>
      </div>
      <Alert
        variant={
          status === "secured"
            ? "success"
            : status === "later"
              ? "warning"
              : "info"
        }
      >
        <StatusIcon />
        <AlertTitle>
          {status === "secured"
            ? "Two-step verification is on"
            : status === "later"
              ? "Two-step verification is still off"
              : "Protect your account"}
        </AlertTitle>
        <AlertDescription>
          {status === "secured"
            ? "New devices now require an additional sign-in step."
            : status === "later"
              ? "You can return to this setup whenever you are ready."
              : "Require a second step when someone signs in on a new device."}
        </AlertDescription>
        <AlertAction>
          {status !== "secured" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                setStatus(status === "later" ? "review" : "later")
              }
            >
              {status === "later" ? "Review setup" : "Later"}
            </Button>
          )}
          {status !== "later" && (
            <Button
              size="xs"
              onClick={() =>
                setStatus(status === "secured" ? "review" : "secured")
              }
            >
              {status === "secured" ? "Reset example" : "Turn on"}
            </Button>
          )}
        </AlertAction>
      </Alert>
    </section>
  )
}
