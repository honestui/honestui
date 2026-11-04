"use client"

import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Input } from "@/registry/default/ui/input"
import { NumberField, NumberFieldGroup, NumberFieldDecrement, NumberFieldInput, NumberFieldIncrement } from "@/registry/default/ui/number-field"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/registry/default/ui/select"
import { Toggle } from "@/registry/default/ui/toggle"

const sizes = ["sm", "default", "lg"] as const
const regions = [{ value: "eu", label: "Europe" }, { value: "na", label: "North America" }]

export default function ControlSizeComparison() {
  return (
    <div className="grid w-full max-w-3xl gap-6">
      {sizes.map((size) => (
        <fieldset key={size} data-control-size={size} className="grid min-w-0 gap-3">
          <legend className="mb-3 text-sm font-medium">{size === "sm" ? "Small" : size === "lg" ? "Large" : "Default"}</legend>
          <div className="grid min-w-0 items-end gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm">
              Name
              <Input size={size} placeholder="Your name" />
            </label>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <FieldControl size={size} type="email" placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel>Region</FieldLabel>
              <Select items={regions} defaultValue="eu">
                <SelectTrigger size={size}><SelectValue /></SelectTrigger>
                <SelectPopup>{regions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Seats</FieldLabel>
              <NumberField size={size} defaultValue={1} min={1}>
                <NumberFieldGroup className="w-full">
                  <NumberFieldDecrement aria-label="Remove a seat" />
                  <NumberFieldInput />
                  <NumberFieldIncrement aria-label="Add a seat" />
                </NumberFieldGroup>
              </NumberField>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size={size}>Apply</Button>
            <Button size={size} variant="outline">Cancel</Button>
            <Toggle size={size} aria-label="Pin selection" className="px-3">Pin</Toggle>
          </div>
        </fieldset>
      ))}
    </div>
  )
}
