import { Info as InfoIcon } from "honestui/icons"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Button } from "@/registry/default/ui/button"

export default function AlertWithIconAction() {
  return (
    <Alert className="max-w-lg">
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="xs">
          Dismiss
        </Button>
        <Button size="xs">Ok</Button>
      </AlertAction>
    </Alert>
  )
}
