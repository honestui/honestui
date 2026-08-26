"use client"

import * as React from "react"
import { Settings2 as Settings2Icon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "@/registry/default/ui/menu"

import { useDataTableContext, getColumnTitle } from "./data-table-context"

export function DataTableViewOptions({
  className,
  label = "Columns",
}: {
  className?: string
  label?: string
}) {
  const { table } = useDataTableContext<unknown>()
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

  if (columns.length === 0) {
    return null
  }

  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" className={className} />}>
        <Settings2Icon aria-hidden className="opacity-72" />
        {label}
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuGroup>
          <MenuGroupLabel>{label}</MenuGroupLabel>
          {columns.map((column) => (
            <MenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) =>
                column.toggleVisibility(checked)
              }
            >
              {getColumnTitle(column)}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}
