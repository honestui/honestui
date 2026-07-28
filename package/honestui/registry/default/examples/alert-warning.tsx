import { TriangleAlert as TriangleAlertIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"

export default function AlertWarning() {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}
