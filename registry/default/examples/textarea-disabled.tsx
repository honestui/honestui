import { Textarea } from "@/registry/default/ui/textarea"

export default function TextareaDisabled() {
  return <Textarea className="w-full max-w-64" placeholder="Can't type here" disabled />
}
