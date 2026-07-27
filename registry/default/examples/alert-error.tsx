import { CircleAlert as CircleAlertIcon } from "love-ui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"

export default function AlertWarning() {
  return (
    <Alert variant="error">
      <CircleAlertIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}
