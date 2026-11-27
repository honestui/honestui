"use client"

import * as React from "react"

import { Flowchart, FlowStep } from "@/registry/honest-ai/ai/flowchart"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

const fields = [
  { value: "amount", label: "Amount" },
  { value: "region", label: "Region" },
  { value: "age", label: "Days overdue" },
]

export default function FlowchartControlsExample() {
  const [field, setField] = React.useState("amount")

  return (
    <div className="w-full max-w-md min-w-0">
      <Flowchart label="Condition editor">
        <FlowStep kind="Trigger" title="Invoice becomes overdue" />
        <FlowStep kind="Condition" title="Branch on a field">
          <Select
            items={fields}
            value={field}
            onValueChange={(next) => {
              if (typeof next === "string") setField(next)
            }}
          >
            <SelectTrigger size="sm" aria-label="Field to branch on" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {fields.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </FlowStep>
      </Flowchart>
    </div>
  )
}
