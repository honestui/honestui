"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { Label } from "@/registry/default/ui/label"
import { Radio, RadioGroup } from "@/registry/default/ui/radio-group"

export default function RadioGroupErrorDemo() {
  const [value, setValue] = React.useState("")
  const [triedToSubmit, setTriedToSubmit] = React.useState(false)

  const invalid = triedToSubmit && value === ""

  return (
    <form className="grid w-auto gap-3" onSubmit={(event) => {
      event.preventDefault()
      setTriedToSubmit(true)
    }}>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Shipping speed</legend>
        <RadioGroup
          value={value}
          onValueChange={(next) => {
            setValue(next as string)
            setTriedToSubmit(false)
          }}
        >
          <Label>
            <Radio
              value="standard"
              aria-invalid={invalid}
              aria-describedby={invalid ? "shipping-speed-error" : undefined}
            />
            Standard (4–6 days)
          </Label>
          <Label>
            <Radio
              value="express"
              aria-invalid={invalid}
              aria-describedby={invalid ? "shipping-speed-error" : undefined}
            />
            Express (1–2 days)
          </Label>
        </RadioGroup>
      </fieldset>
      {invalid ? (
        <p id="shipping-speed-error" role="alert" className="text-sm text-destructive">
          Choose a shipping speed before continuing.
        </p>
      ) : null}
      <Button type="submit">Continue</Button>
    </form>
  )
}
