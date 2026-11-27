"use client"

import * as React from "react"
import { ListFilter as ListFilterIcon } from "honestui/icons"

import { FilterBar, type FilterValue } from "@/registry/default/product/filter-bar/filter-bar"
import {
  QueryBuilder,
  filtersToQuery,
  matchesQuery,
  queryToFilters,
  type QueryGroup,
} from "@/registry/default/product/query-builder/query-builder"
import { Toggle } from "@/registry/default/ui/toggle"

import { ORDER_FIELDS, ORDER_RECORDS } from "./query-builder-example-data"

/**
 * Filter Bar for everyday filters, Query Builder when someone needs "or" or
 * nesting. The same field definitions drive both, and the conversion keeps
 * every condition: switching back is offered only when the query still fits
 * Filter Bar's shape.
 */
export default function QueryBuilderFilterBar() {
  const [filters, setFilters] = React.useState<FilterValue[]>([
    { key: "status", operator: "is", value: ["active"] },
  ])
  const [query, setQuery] = React.useState<QueryGroup | null>(null)
  const advanced = query !== null
  const whyId = React.useId()

  const simpleVersion = query ? queryToFilters(query, ORDER_FIELDS) : filters
  const activeQuery = query ?? filtersToQuery(filters, ORDER_FIELDS)
  const matches = ORDER_RECORDS.filter((record) => matchesQuery(record, activeQuery, ORDER_FIELDS))

  function setAdvanced(next: boolean) {
    if (next) {
      setQuery(filtersToQuery(filters, ORDER_FIELDS))
    } else if (simpleVersion) {
      setFilters(simpleVersion)
      setQuery(null)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--hui-space-4)]">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-[var(--hui-space-3)]">
        <div className="min-w-0 flex-1">
          {advanced ? (
            <p className="m-0 flex h-[var(--hui-control-height-sm,var(--hui-space-8))] items-center text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]">
              Advanced filter
            </p>
          ) : (
            <FilterBar filters={ORDER_FIELDS} value={filters} onValueChange={setFilters} />
          )}
        </div>
        <Toggle
          size="sm"
          pressed={advanced}
          onPressedChange={setAdvanced}
          disabled={advanced && !simpleVersion}
          aria-describedby={advanced && !simpleVersion ? whyId : undefined}
        >
          <ListFilterIcon aria-hidden="true" className="size-3.5" />
          Advanced
        </Toggle>
      </div>

      {query && (
        <QueryBuilder aria-label="Advanced order filter" fields={ORDER_FIELDS} value={query} onValueChange={setQuery} />
      )}

      <p
        aria-live="polite"
        className="m-0 flex flex-wrap gap-x-[var(--hui-space-3)] px-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        <span className="tabular-nums text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
          {matches.length} of {ORDER_RECORDS.length} orders
        </span>
        {advanced && !simpleVersion && (
          <span id={whyId}>
            Uses “or” or a group, so it stays in advanced mode. Remove those to switch back.
          </span>
        )}
      </p>
    </div>
  )
}
