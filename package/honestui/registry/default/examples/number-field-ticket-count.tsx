import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/registry/default/ui/number-field"

export default function NumberFieldTicketCount() {
  return (
    <NumberField defaultValue={3} min={1} max={10} className="w-40">
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Ticket count" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}
