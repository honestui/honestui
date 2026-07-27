import { CreditCard as CreditCardIcon } from "love-ui/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"

export default function AlertBillingNotice() {
  return (
    <Alert variant="warning" className="max-w-md">
      <CreditCardIcon />
      <AlertTitle>Payment method expires soon</AlertTitle>
      <AlertDescription>
        Update the card on file before June 14 to keep automations running.
      </AlertDescription>
    </Alert>
  )
}
