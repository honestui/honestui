import { CircleAlert as CircleAlertIcon } from "honestui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"

export default function AlertWarning() {
  return (
    <Alert variant="error" className="max-w-lg">
      <CircleAlertIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}
