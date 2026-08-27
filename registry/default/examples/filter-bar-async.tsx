"use client"

import * as React from "react"

import { Switch } from "@/registry/default/ui/switch"
import {
  FilterBar,
  type FilterOption,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { CUSTOMER_DIRECTORY } from "./filter-bar-example-data"

const REQUEST_LATENCY_MS = 650

/**
 * Options load like they would from an API. Flip the switch to make requests
 * fail on purpose: existing selections stay, the field explains itself, and
 * Try again recovers without touching other filters.
 */
export default function FilterBarAsync() {
  const [value, setValue] = React.useState<FilterValue[]>([])
  const [failRequests, setFailRequests] = React.useState(false)
  const attemptsRef = React.useRef(0)

  async function loadCustomers(query: string): Promise<FilterOption[]> {
    const attempt = ++attemptsRef.current

    await new Promise((resolve) => setTimeout(resolve, REQUEST_LATENCY_MS))

    if (failRequests && attempt % 2 === 1) {
      throw new Error("request failed")
    }

    const needle = query.trim().toLowerCase()

    return CUSTOMER_DIRECTORY.filter((name) =>
      name.toLowerCase().includes(needle)
    ).slice(0, 12).map((label) => ({ label, value: label }))
  }

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "customer",
            label: "Customer",
            type: "multi-select",
            searchable: true,
            loadOptions: (query) => loadCustomers(query),
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={failRequests}
          onCheckedChange={(checked) => setFailRequests(checked === true)}
          aria-label="Fail every other request"
        />
        Fail requests to see the error state and recovery.
      </p>
    </div>
  )
}
