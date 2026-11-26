"use client"

import { Button } from "@/registry/default/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/registry/default/ui/native-select"

export default function NativeSelectField() {
  return (
    <Form
      className="flex w-full max-w-64 flex-col gap-[var(--hui-space-4)]"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field name="country">
        <FieldLabel>Country</FieldLabel>
        <NativeSelect required defaultValue="">
          <NativeSelectOption value="" disabled>
            Select a country
          </NativeSelectOption>
          <NativeSelectOption value="au">Australia</NativeSelectOption>
          <NativeSelectOption value="ca">Canada</NativeSelectOption>
          <NativeSelectOption value="de">Germany</NativeSelectOption>
          <NativeSelectOption value="jp">Japan</NativeSelectOption>
          <NativeSelectOption value="gb">United Kingdom</NativeSelectOption>
          <NativeSelectOption value="us">United States</NativeSelectOption>
        </NativeSelect>
        <FieldDescription>Used to calculate shipping and tax.</FieldDescription>
        <FieldError>Choose the country you ship to.</FieldError>
      </Field>
      <Button type="submit" className="self-start">
        Continue
      </Button>
    </Form>
  )
}
