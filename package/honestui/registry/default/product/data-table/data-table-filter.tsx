"use client"

import * as React from "react"
import { Funnel as FunnelIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

import { useDataTableContext } from "./data-table-context"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilterConfig {
  columnId: string
  title: string
  options: DataTableFilterOption[]
}

function getActiveFilterCount(
  filters: Array<{ id: string; value: unknown }>,
  facets: DataTableFilterConfig[],
) {
  return filters.filter(
    (filter) =>
      facets.some((facet) => facet.columnId === filter.id) &&
      Array.isArray(filter.value) &&
      filter.value.length > 0,
  ).length
}

export function DataTableFilter({
  facets,
  className,
}: {
  facets: DataTableFilterConfig[]
  className?: string
}) {
  const { table } = useDataTableContext<unknown>()
  const columnFilters = table.getState().columnFilters ?? []
  const activeCount = getActiveFilterCount(columnFilters, facets)

  const selectedValues = (columnId: string): string[] => {
    const match = columnFilters.find((filter) => filter.id === columnId)

    return Array.isArray(match?.value) ? (match.value as string[]) : []
  }

  const setValueChecked = (
    columnId: string,
    optionValue: string,
    checked: boolean,
  ) => {
    table.setColumnFilters((currentFilters) => {
      const currentFilter = currentFilters.find(
        (filter) => filter.id === columnId,
      )
      const currentValues = Array.isArray(currentFilter?.value)
        ? (currentFilter.value as string[])
        : []
      const nextValues = checked
        ? [...new Set([...currentValues, optionValue])]
        : currentValues.filter((value) => value !== optionValue)
      const otherFilters = currentFilters.filter(
        (filter) => filter.id !== columnId,
      )

      return [
        ...otherFilters,
        ...(nextValues.length > 0
          ? [{ id: columnId, value: nextValues }]
          : []),
      ]
    })
  }

  const clearAll = () => {
    const facetIds = new Set(facets.map((facet) => facet.columnId))

    table.setColumnFilters((currentFilters) =>
      currentFilters.filter((filter) => !facetIds.has(filter.id)),
    )
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="sm" className={className} />
        }
      >
        <FunnelIcon aria-hidden className="opacity-72" />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex min-w-[var(--hui-space-5)] items-center justify-center rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-1)] [font-size:var(--hui-font-size-micro)]">
            {activeCount}
          </span>
        )}
      </MenuTrigger>
      <MenuPopup align="start">
        {facets.map((facet, index) => (
          <MenuGroup key={facet.columnId}>
            {index > 0 && <MenuSeparator />}
            <MenuGroupLabel>{facet.title}</MenuGroupLabel>
            {facet.options.map((option) => (
              <MenuCheckboxItem
                key={option.value}
                checked={selectedValues(facet.columnId).includes(option.value)}
                onCheckedChange={(checked) =>
                  setValueChecked(facet.columnId, option.value, checked)
                }
              >
                {option.label}
              </MenuCheckboxItem>
            ))}
          </MenuGroup>
        ))}
        {activeCount > 0 && (
          <>
            <MenuSeparator />
            <MenuItem onClick={clearAll}>Clear all</MenuItem>
          </>
        )}
      </MenuPopup>
    </Menu>
  )
}
