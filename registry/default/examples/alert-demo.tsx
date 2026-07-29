import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"

export default function AlertDemo() {
  return (
    <Alert className="max-w-lg">
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <p>Describe what can be done about it here.</p>
      </AlertDescription>
    </Alert>
  )
}
