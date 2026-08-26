"use client"

import * as React from "react"


import {
  DateRangePicker,
  getDateRangePresets,
} from "@/registry/default/product/date-range-picker/date-range-picker"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldHelperSlot,
  FieldLabel,
} from "@/registry/default/ui/field"

export default function DateRangePickerForm() {
  const id = React.useId()
  const invalidId = React.useId()

  return (
    <div className="grid w-full max-w-2xl gap-8">
      <Field>
        <FieldLabel htmlFor={id}>Report period</FieldLabel>
        <DateRangePicker
          id={id}
          defaultValue={{ from: new Date(), to: new Date() }}
          required
          presets={getDateRangePresets()}
          aria-describedby="report-period-description"
        />
        <FieldHelperSlot>
          <FieldDescription id="report-period-description">
            The range the report covers, including both endpoints.
          </FieldDescription>
        </FieldHelperSlot>
      </Field>

      <Field data-invalid>
        <FieldLabel htmlFor={invalidId}>Renewal window</FieldLabel>
        <DateRangePicker
          id={invalidId}
          invalid
          placeholder="Select renewal dates"
          aria-label="Renewal window"
        />
        <FieldHelperSlot>
          <FieldError>Choose an end date on or after the start date.</FieldError>
        </FieldHelperSlot>
      </Field>

      <Field>
        <FieldLabel>Audit period (read only)</FieldLabel>
        <DateRangePicker readOnly defaultValue={{ from: new Date(), to: new Date() }} />
        <FieldHelperSlot>
          <FieldDescription>Closed periods can be inspected but not edited.</FieldDescription>
        </FieldHelperSlot>
      </Field>
    </div>
  )
}
