"use client"

import * as React from "react"
import {
  Download as DownloadIcon,
  FunnelPlus as FunnelPlusIcon,
  RefreshRounded as RefreshIcon,
  Search as SearchIcon,
  Settings2 as Settings2Icon,
  X as XIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
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
import {
  Popover,
  PopoverClose,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Toolbar } from "@/registry/default/ui/toolbar"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"

import {
  getDataGridColumnMeta,
  getDataGridColumnTitle,
  useDataGridContext,
  type DataGridFilterOption,
  type DataGridFilterValue,
} from "./data-grid-context"
import {
  buildDataGridCsv,
  DATA_GRID_FILTER_OPERATORS,
  formatDataGridFilter,
} from "./data-grid-utils"

export function DataGridToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      data-slot="data-grid-toolbar"
      className={cn(
        "min-w-0 flex-wrap gap-[var(--hui-space-2)] overflow-visible rounded-none border-0 p-0",
        className,
      )}
      {...props}
    >
      {children}
    </Toolbar>
  )
}

export function DataGridToolbarSpacer({ className }: { className?: string }) {
  return <span aria-hidden className={cn("min-w-0 flex-1", className)} />
}

export interface DataGridSearchProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "size" | "type"
> {
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

export function DataGridSearch({
  placeholder = "Search...",
  debounceMs,
  ariaLabel,
  className,
  ...props
}: DataGridSearchProps) {
  const { table } = useDataGridContext<unknown>()
  const externalValue = String(table.getState().globalFilter ?? "")
  const [draft, setDraft] = React.useState({
    value: externalValue,
    externalValue,
  })
  const value =
    draft.externalValue === externalValue ? draft.value : externalValue

  React.useEffect(() => {
    if (value === externalValue) return
    if (debounceMs === undefined) {
      table.setGlobalFilter(value)
      table.setPageIndex(0)
      return
    }

    const timeout = window.setTimeout(() => {
      table.setGlobalFilter(value)
      table.setPageIndex(0)
    }, debounceMs)

    return () => window.clearTimeout(timeout)
  }, [debounceMs, externalValue, table, value])

  const defaultLabel = placeholder.replace(/\.{3}$/, "").trim()

  return (
    <span
      data-slot="data-grid-search"
      className={cn("relative block w-full sm:w-72", className)}
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute start-[var(--hui-space-3)] top-1/2 z-1 size-4 -translate-y-1/2 text-[var(--hui-color-foreground-base-secondary)]"
      />
      <Input
        type="search"
        aria-label={ariaLabel?.trim() || defaultLabel || "Search data grid"}
        placeholder={placeholder}
        value={value}
        onChange={(event) =>
          setDraft({ value: event.target.value, externalValue })
        }
        className="min-h-[var(--hui-space-10)] [&>[data-slot=input]]:!ps-[var(--hui-space-9)]"
        {...props}
      />
    </span>
  )
}

function normalizeOptions(options?: DataGridFilterOption[] | string[]) {
  return (options ?? []).map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  )
}

function DataGridFilterValueField({
  type,
  options,
  value,
  onChange,
  label,
}: {
  type: string
  options?: DataGridFilterOption[] | string[]
  value: unknown
  onChange: (value: unknown) => void
  label: string
}) {
  const normalizedOptions = normalizeOptions(options)

  if (type === "enum" || type === "boolean") {
    const items =
      type === "boolean"
        ? [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]
        : normalizedOptions

    return (
      <Select
        items={items}
        value={String(value ?? "")}
        onValueChange={onChange}
      >
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder="Choose a value" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      aria-label={label}
      type={type === "date" ? "date" : type === "number" || type === "currency" ? "number" : "text"}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function DataGridFilterTrigger({ className }: { className?: string }) {
  const { table } = useDataGridContext<unknown>()
  const filterableColumns = table
    .getAllLeafColumns()
    .filter((column) => getDataGridColumnMeta(column).filter)
  const [columnId, setColumnId] = React.useState(
    filterableColumns[0]?.id ?? "",
  )
  const selectedColumn = filterableColumns.find(
    (column) => column.id === columnId,
  )
  const config = selectedColumn
    ? getDataGridColumnMeta(selectedColumn).filter
    : undefined
  const type = config?.type ?? "text"
  const operators = DATA_GRID_FILTER_OPERATORS[type]
  const [selectedOperator, setSelectedOperator] = React.useState(
    operators[0]?.value ?? "",
  )
  const operator = operators.some((item) => item.value === selectedOperator)
    ? selectedOperator
    : operators[0]?.value ?? ""
  const [value, setValue] = React.useState<unknown>("")
  const [valueTo, setValueTo] = React.useState<unknown>("")
  const activeOperator = operators.find((item) => item.value === operator)

  if (filterableColumns.length === 0) return null

  const columnItems = filterableColumns.map((column) => ({
    label: getDataGridColumnTitle(column),
    value: column.id,
  }))
  const operatorItems = operators.map((item) => ({
    label: item.label,
    value: item.value,
  }))
  const hasRequiredValue =
    !activeOperator?.needsValue ||
    (String(value).trim() !== "" &&
      (!activeOperator.needsSecondValue || String(valueTo).trim() !== ""))

  const apply = () => {
    if (!selectedColumn || !hasRequiredValue) return
    const nextValue: DataGridFilterValue = {
      operator,
      ...(activeOperator?.needsValue && {
        value: operator === "is-any-of" ? [value] : value,
      }),
      ...(activeOperator?.needsSecondValue && { valueTo }),
    }
    selectedColumn.setFilterValue(nextValue)
    table.setPageIndex(0)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="sm" className={className} />}
      >
        <FunnelPlusIcon aria-hidden />
        Add filter
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-72 max-w-[calc(100vw-2rem)] p-[var(--hui-space-4)]">
        <PopoverTitle className="mb-[var(--hui-space-4)]">Add filter</PopoverTitle>
        <div className="grid gap-[var(--hui-space-4)]">
          <label className="grid gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
            <span>Column</span>
            <Select
              items={columnItems}
              value={columnId}
              onValueChange={(nextValue) => {
                if (!nextValue) return
                const nextColumn = filterableColumns.find(
                  (column) => column.id === nextValue,
                )
                const nextType = nextColumn
                  ? getDataGridColumnMeta(nextColumn).filter?.type
                  : undefined
                setColumnId(nextValue)
                setSelectedOperator(
                  nextType
                    ? DATA_GRID_FILTER_OPERATORS[nextType][0]?.value ?? ""
                    : "",
                )
                setValue("")
                setValueTo("")
              }}
            >
              <SelectTrigger aria-label="Filter column" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
            <span>Condition</span>
            <Select
              items={operatorItems}
              value={operator}
              onValueChange={(nextValue) =>
                nextValue && setSelectedOperator(nextValue)
              }
            >
              <SelectTrigger aria-label="Filter condition" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {activeOperator?.needsValue && (
            <label className="grid gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
              <span>Value</span>
              <DataGridFilterValueField
                type={type}
                options={config?.options}
                value={value}
                onChange={setValue}
                label="Filter value"
              />
            </label>
          )}
          {activeOperator?.needsSecondValue && (
            <label className="grid gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
              <span>Second value</span>
              <DataGridFilterValueField
                type={type}
                options={config?.options}
                value={valueTo}
                onChange={setValueTo}
                label="Second filter value"
              />
            </label>
          )}
          <div className="flex justify-end gap-[var(--hui-space-2)]">
            <PopoverClose render={<Button variant="ghost" size="sm" />}>Cancel</PopoverClose>
            <PopoverClose
              render={<Button variant="outline" size="sm" disabled={!hasRequiredValue} onClick={apply} />}
            >
              Apply
            </PopoverClose>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export function DataGridActiveFilters({ className }: { className?: string }) {
  const { table } = useDataGridContext<unknown>()
  const filters = table.getState().columnFilters
  if (filters.length === 0) return null

  return (
    <div
      data-slot="data-grid-active-filters"
      className={cn("flex min-w-0 flex-wrap items-center gap-[var(--hui-space-2)]", className)}
    >
      <span role="status" className="sr-only">
        {table.getFilteredRowModel().rows.length} results
      </span>
      {filters.map((filter) => {
        const column = table.getColumn(filter.id)
        if (!column) return null
        const label = formatDataGridFilter(
          getDataGridColumnTitle(column),
          filter.value as DataGridFilterValue,
        )

        return (
          <Button
            key={filter.id}
            variant="secondary"
            size="xs"
            aria-label={`Remove filter: ${label}`}
            onClick={() => column.setFilterValue(undefined)}
            className="max-w-64"
          >
            <span className="truncate">{label}</span>
            <XIcon aria-hidden />
          </Button>
        )
      })}
      {filters.length > 1 && (
        <Button variant="link" size="xs" onClick={() => table.resetColumnFilters()}>
          Clear all
        </Button>
      )}
    </div>
  )
}

export function DataGridColumnVisibility({
  className,
  label = "Columns",
}: {
  className?: string
  label?: string
}) {
  const { table, resetView } = useDataGridContext<unknown>()
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide())
  if (columns.length === 0) return null

  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" className={className} />}>
        <Settings2Icon aria-hidden />
        {label}
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>{label}</MenuGroupLabel>
          {columns.map((column) => (
            <MenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {getDataGridColumnTitle(column)}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
        <MenuSeparator />
        <MenuItem onClick={() => table.toggleAllColumnsVisible(true)}>Show all</MenuItem>
        <MenuItem onClick={resetView}>Reset view</MenuItem>
      </MenuPopup>
    </Menu>
  )
}

export function DataGridExport({
  className,
  fileName = "data-grid.csv",
  onExport,
}: {
  className?: string
  fileName?: string
  onExport?: () => void
}) {
  const { table } = useDataGridContext<unknown>()

  const exportRows = () => {
    if (onExport) {
      onExport()
      return
    }

    const columns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "select" && column.id !== "actions")
    const csv = buildDataGridCsv(
      columns.map(getDataGridColumnTitle),
      table.getFilteredRowModel().rows.map((row) =>
        columns.map((column) => row.getValue(column.id)),
      ),
    )
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" size="sm" className={className} onClick={exportRows}>
      <DownloadIcon aria-hidden />
      Export CSV
    </Button>
  )
}

export function DataGridRefresh({
  className,
  onRefresh,
}: {
  className?: string
  onRefresh: () => void | Promise<void>
}) {
  const { refreshing } = useDataGridContext<unknown>()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh data"
            className={className}
            disabled={refreshing}
            onClick={onRefresh}
          />
        }
      >
        <RefreshIcon aria-hidden className={cn(refreshing && "motion-safe:animate-spin")} />
      </TooltipTrigger>
      <TooltipPopup>Refresh data</TooltipPopup>
    </Tooltip>
  )
}
