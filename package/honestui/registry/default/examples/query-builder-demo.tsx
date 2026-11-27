"use client"

import * as React from "react"

import {
  QueryBuilder,
  formatQuery,
  matchesQuery,
} from "@/registry/default/product/query-builder/query-builder"

import { DEMO_QUERY, ORDER_FIELDS, ORDER_RECORDS } from "./query-builder-example-data"

/**
 * Status is any of Active or Pending, and the order is either over $1,000 or
 * design work. The readout runs `matchesQuery` over ten sample orders.
 */
export default function QueryBuilderDemo() {
  const [query, setQuery] = React.useState(DEMO_QUERY)
  const matches = ORDER_RECORDS.filter((record) => matchesQuery(record, query, ORDER_FIELDS))
  const sentence = formatQuery(query, ORDER_FIELDS)

  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--hui-space-4)]">
      <QueryBuilder aria-label="Order conditions" fields={ORDER_FIELDS} value={query} onValueChange={setQuery} />
      <div
        aria-live="polite"
        className="flex flex-col gap-[var(--hui-space-1)] px-[var(--hui-space-1)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        <p className="m-0 tabular-nums text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
          {matches.length} of {ORDER_RECORDS.length} orders match
        </p>
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)]">
          {matches.length > 0 ? matches.map((record) => record.customer).join(", ") : "No orders match these conditions."}
        </p>
        {sentence && <p className="sr-only">Query: {sentence}</p>}
      </div>
    </div>
  )
}
