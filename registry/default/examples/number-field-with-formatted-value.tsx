import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/registry/default/ui/number-field"

export default function NumberFieldWithFormattedValue() {
  return (
    <NumberField className="w-full max-w-64"
      defaultValue={0}
      format={{ style: "currency", currency: "USD" }}
    >
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}
