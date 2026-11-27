"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  Lock as LockIcon,
  Minus as MinusIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/registry/default/ui/menu"

import type {
  FlatPermissionResource,
  PermissionCellValue,
  PermissionChange,
  PermissionGrants,
  PermissionMatrixLabels,
  PermissionResource,
  PermissionRole,
  PermissionState,
  ResolvedPermission,
} from "./permission-matrix-types"
import {
  cycleCellValue,
  defaultPermissionMatrixLabels,
  diffGrants,
  flattenResources,
  getCellValue,
  getParentIndex,
  resolvePermission,
  setCell,
  setCells,
} from "./permission-matrix-utils"

export type {
  PermissionCellValue,
  PermissionChange,
  PermissionGrants,
  PermissionMatrixLabels,
  PermissionResource,
  PermissionRole,
  PermissionSource,
  PermissionState,
  ResolvedPermission,
} from "./permission-matrix-types"
export {
  defaultPermissionMatrixLabels,
  diffGrants,
  resolvePermission,
  setCell,
  setCells,
} from "./permission-matrix-utils"

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const labelText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
const hairline = "border-[var(--hui-color-border-base-primary)]"

type MatrixController = {
  roles: readonly PermissionRole[]
  rows: readonly FlatPermissionResource[]
  grants: PermissionGrants
  changes: readonly PermissionChange[]
  dirty: ReadonlySet<string>
  resolve: (roleId: string, resourceId: string) => ResolvedPermission
  setValue: (next: PermissionGrants) => void
  discard: () => void
  save: (() => void) | null
  saving: boolean
  disabled: boolean
  label: string
  labels: PermissionMatrixLabels
}

const PermissionMatrixContext = React.createContext<MatrixController | null>(null)

function usePermissionMatrix(part: string) {
  const context = React.useContext(PermissionMatrixContext)
  if (!context) throw new Error(`${part} must be used within a PermissionMatrix.`)
  return context
}

const cellKey = (roleId: string, resourceId: string) => `${roleId}\u0000${resourceId}`

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export type PermissionMatrixProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Columns, in order. */
  roles: readonly PermissionRole[]
  /** Rows, in order. Children render indented under their parent. */
  resources: readonly PermissionResource[]
  /** The decisions that are set. Cells missing from it inherit. */
  value?: PermissionGrants | undefined
  defaultValue?: PermissionGrants | undefined
  onValueChange?: ((value: PermissionGrants, changes: PermissionChange[]) => void) | undefined
  /** The saved decisions that changes are counted against. Defaults to the value when the matrix mounts, and to each saved value after `onSave`. */
  savedValue?: PermissionGrants | undefined
  /** Shows Save and Discard while there are changes. A returned promise keeps Save busy until it settles. */
  onSave?: ((value: PermissionGrants, changes: PermissionChange[]) => void | Promise<void>) | undefined
  /** The decision when nothing up the chain is set. Defaults to `deny`. */
  defaultPermission?: PermissionState | undefined
  /** Names the grid. Defaults to "Permissions". */
  label?: string | undefined
  disabled?: boolean | undefined
  labels?: Partial<PermissionMatrixLabels> | undefined
}

/**
 * Roles across, resources down, and one decision per cell: allowed, denied,
 * or inherited from a parent resource or a base role. Cells say where an
 * inherited decision comes from, and changes are counted until they are saved.
 */
function PermissionMatrix({
  roles,
  resources,
  value: valueProp,
  defaultValue = {},
  onValueChange,
  savedValue: savedValueProp,
  onSave,
  defaultPermission = "deny",
  label = "Permissions",
  disabled = false,
  labels: labelsProp,
  className,
  children,
  ...props
}: PermissionMatrixProps) {
  const labels = React.useMemo(
    () => ({ ...defaultPermissionMatrixLabels, ...labelsProp }),
    [labelsProp]
  )
  const [internal, setInternal] = React.useState(defaultValue)
  const grants = valueProp ?? internal
  const [baseline, setBaseline] = React.useState(grants)
  const saved = savedValueProp ?? baseline
  const [saving, setSaving] = React.useState(false)

  const rows = React.useMemo(() => flattenResources(resources), [resources])
  const parents = React.useMemo(() => getParentIndex(resources), [resources])
  const changes = React.useMemo(() => diffGrants(saved, grants), [saved, grants])
  const dirty = React.useMemo(
    () => new Set(changes.map((change) => cellKey(change.roleId, change.resourceId))),
    [changes]
  )

  const setValue = (next: PermissionGrants) => {
    if (valueProp === undefined) setInternal(next)
    onValueChange?.(next, diffGrants(saved, next))
  }

  const save = onSave
    ? () => {
        const result = onSave(grants, changes)
        const settle = () => {
          setSaving(false)
          setBaseline(grants)
        }
        if (result instanceof Promise) {
          setSaving(true)
          result.then(settle, () => setSaving(false))
        } else {
          settle()
        }
      }
    : null

  const controller: MatrixController = {
    roles,
    rows,
    grants,
    changes,
    dirty,
    resolve: (roleId, resourceId) =>
      resolvePermission(grants, roleId, resourceId, { roles, parents, defaultValue: defaultPermission }),
    setValue,
    discard: () => setValue(saved),
    save,
    saving,
    disabled,
    label,
    labels,
  }

  return (
    <PermissionMatrixContext.Provider value={controller}>
      <div
        data-slot="permission-matrix"
        className={cn(
          "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
          hairline,
          "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <PermissionMatrixGrid />
            <PermissionMatrixFooter />
          </>
        )}
      </div>
    </PermissionMatrixContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Grid                                                                       */
/* -------------------------------------------------------------------------- */

type Position = { row: number; col: number }

/** The mark inside a cell. Set decisions are filled; inherited ones are outlined and neutral. */
function PermissionMark({ value, inherited }: { value: PermissionState; inherited: boolean }) {
  const Icon = value === "allow" ? CheckIcon : MinusIcon
  return (
    <span
      aria-hidden="true"
      data-slot="permission-matrix-mark"
      data-value={value}
      data-inherited={inherited ? "" : undefined}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),color_var(--hui-duration-fast)_var(--hui-ease-out)]",
        inherited
          ? "border border-dashed border-[var(--hui-color-border-base-tertiary)] text-[var(--hui-color-foreground-base-secondary)]"
          : value === "allow"
            ? "bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-success-primary)]"
            : "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-primary)]"
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

function useSourceText() {
  const { roles, rows, labels } = usePermissionMatrix("PermissionMatrixGrid")
  return (resolved: ResolvedPermission) => {
    const { source } = resolved
    const resourceName = (id: string) => rows.find((row) => row.resource.id === id)?.resource.name ?? id
    const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? id
    switch (source.kind) {
      case "explicit":
        return null
      case "default":
        return labels.byDefault
      case "resource":
        return labels.inheritedFrom(resourceName(source.resourceId))
      case "role":
        return labels.inheritedFromRoleOn(roleName(source.roleId), resourceName(source.resourceId))
    }
  }
}

/** The scrolling table: sticky role headers across the top and resource names down the side. */
export type PermissionMatrixGridProps = React.ComponentProps<"div"> & {
  /** The tallest the grid grows before it scrolls under its sticky headers. Defaults to `28rem`. */
  maxHeight?: string | undefined
}

function PermissionMatrixGrid({ maxHeight = "28rem", className, style, ...rest }: PermissionMatrixGridProps) {
  const controller = usePermissionMatrix("PermissionMatrixGrid")
  const { roles, rows, grants, dirty, resolve, setValue, disabled, label, labels } = controller
  const sourceText = useSourceText()
  const cells = React.useRef(new Map<string, HTMLElement>())
  const [focus, setFocus] = React.useState<Position>({ row: 1, col: 1 })

  const lastRow = rows.length
  const lastCol = roles.length
  const editable = (role: PermissionRole) => !disabled && !role.readOnly
  const editableRoles = roles.filter(editable)

  const register = (row: number, col: number) => (element: HTMLElement | null) => {
    const key = `${row}:${col}`
    if (element) cells.current.set(key, element)
    else cells.current.delete(key)
  }
  const tabIndexAt = (row: number, col: number) =>
    focus.row === Math.min(row, lastRow) && focus.col === Math.min(col, lastCol) ? 0 : -1

  const moveTo = (row: number, col: number) => {
    const next = { row: Math.max(0, Math.min(lastRow, row)), col: Math.max(0, Math.min(lastCol, col)) }
    // The corner above the resource names holds nothing to act on.
    if (next.row === 0 && next.col === 0) return
    setFocus(next)
    cells.current.get(`${next.row}:${next.col}`)?.focus()
  }

  const changeCell = (role: PermissionRole, resourceId: string, value: PermissionCellValue) => {
    if (!editable(role)) return
    setValue(setCell(grants, role.id, resourceId, value))
  }

  // Captured at the table, so arrow keys move between cells before a menu trigger can claim them.
  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLTableElement>) => {
    const position = (event.target as HTMLElement).dataset.matrixPos
    if (!position) return
    const [row, col] = position.split(":").map(Number)
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } as Record<string, number>

    let handled = true
    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft":
        moveTo(row, col + step[event.key])
        break
      case "ArrowDown":
        moveTo(row + 1, col)
        break
      case "ArrowUp":
        moveTo(row === 1 && col === 0 ? 1 : row - 1, col)
        break
      case "Home":
        if (event.ctrlKey || event.metaKey) moveTo(1, 1)
        else moveTo(row, row === 0 ? 1 : 0)
        break
      case "End":
        if (event.ctrlKey || event.metaKey) moveTo(lastRow, lastCol)
        else moveTo(row, lastCol)
        break
      case "PageDown":
        moveTo(row + 10, col)
        break
      case "PageUp":
        moveTo(Math.max(1, row - 10), col)
        break
      default:
        handled = false
    }

    // Only data cells change with keys; headers keep Enter and Space for their menus.
    if (!handled && row > 0 && col > 0) {
      const role = roles[col - 1]
      const resourceId = rows[row - 1].resource.id
      const current = getCellValue(grants, role.id, resourceId)
      const key = event.key.toLowerCase()
      handled = true
      if (event.key === " " || event.key === "Enter") changeCell(role, resourceId, cycleCellValue(current))
      else if (key === "a") changeCell(role, resourceId, "allow")
      else if (key === "d") changeCell(role, resourceId, "deny")
      else if (key === "i" || event.key === "Backspace" || event.key === "Delete") {
        changeCell(role, resourceId, "inherit")
      } else handled = false
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const bulkItems = (apply: (value: PermissionCellValue) => void) => (
    <>
      <MenuItem onClick={() => apply("allow")}>
        <CheckIcon aria-hidden="true" />
        {labels.allowAll}
      </MenuItem>
      <MenuItem onClick={() => apply("deny")}>
        <MinusIcon aria-hidden="true" />
        {labels.denyAll}
      </MenuItem>
      <MenuSeparator />
      <MenuItem onClick={() => apply("inherit")}>{labels.inheritAll}</MenuItem>
    </>
  )

  const headerButton =
    "flex w-full min-w-0 items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-1)] px-[var(--hui-space-2)] py-[var(--hui-space-1)] text-start outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[-2px] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]"

  return (
    <div
      data-slot="permission-matrix-grid"
      className={cn("relative min-w-0 overflow-auto overscroll-contain", className)}
      style={{ maxHeight, ...style }}
      {...rest}
    >
      <table
        role="grid"
        aria-label={label}
        aria-readonly={editableRoles.length === 0 || undefined}
        onKeyDownCapture={handleKeyDownCapture}
        className="w-full min-w-max border-separate border-spacing-0"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className={cn(
                "sticky start-0 top-0 z-[3] w-36 max-w-36 min-w-36 border-b-[0.5px] @lg:w-auto @lg:max-w-none @lg:min-w-48 bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-start align-bottom text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]",
                hairline,
                metaText
              )}
            >
              {labels.resources}
            </th>
            {roles.map((role, index) => {
              const base = roles.find((candidate) => candidate.id === role.inheritsFrom)
              const meta = role.readOnly ? labels.readOnly : base ? labels.inheritsFrom(base.name) : null
              const content = (
                <>
                  <span className="flex min-w-0 flex-1 flex-col items-center text-center">
                    <span className={cn("flex max-w-full items-center gap-[var(--hui-space-1)] [font-weight:var(--hui-font-weight-medium)]", labelText)}>
                      {role.readOnly && (
                        <LockIcon aria-hidden="true" className="size-3 shrink-0 text-[var(--hui-color-foreground-base-secondary)]" />
                      )}
                      <span className="truncate">{role.name}</span>
                      {editable(role) && (
                        <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)]" />
                      )}
                    </span>
                    {meta && (
                      <span className={cn("max-w-full truncate text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]", metaText)}>
                        {meta}
                      </span>
                    )}
                  </span>
                </>
              )
              return (
                <th
                  key={role.id}
                  scope="col"
                  title={role.description}
                  className={cn(
                    "sticky top-0 z-[2] min-w-24 border-b-[0.5px] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-1)] py-[var(--hui-space-2)] text-center align-bottom",
                    hairline
                  )}
                >
                  {editable(role) ? (
                    <Menu>
                      <MenuTrigger
                        ref={register(0, index + 1)}
                        data-matrix-pos={`0:${index + 1}`}
                        tabIndex={tabIndexAt(0, index + 1)}
                        onFocus={() => setFocus({ row: 0, col: index + 1 })}
                        className={headerButton}
                      >
                        {content}
                        <span className="sr-only">, {labels.columnActions(role.name)}</span>
                      </MenuTrigger>
                      <MenuPopup align="start">
                        {bulkItems((value) =>
                          setValue(
                            setCells(
                              grants,
                              rows.map((row) => ({ roleId: role.id, resourceId: row.resource.id })),
                              value
                            )
                          )
                        )}
                      </MenuPopup>
                    </Menu>
                  ) : (
                    <span
                      ref={register(0, index + 1)}
                      data-matrix-pos={`0:${index + 1}`}
                      tabIndex={tabIndexAt(0, index + 1)}
                      onFocus={() => setFocus({ row: 0, col: index + 1 })}
                      className={headerButton}
                    >
                      {content}
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ resource, depth }, rowIndex) => {
            const row = rowIndex + 1
            const isLast = rowIndex === rows.length - 1
            const border = isLast ? "" : cn("border-b-[0.5px]", hairline)
            return (
              <tr key={resource.id} data-depth={depth} className="group/row">
                <th
                  scope="row"
                  className={cn(
                    "sticky start-0 z-[1] max-w-36 bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] @lg:max-w-none py-[var(--hui-space-1)] text-start [font-weight:var(--hui-font-weight-regular)] group-hover/row:bg-[color-mix(in_oklch,var(--hui-color-background-base-primary-hover)_60%,var(--hui-color-background-base-primary))]",
                    border
                  )}
                >
                  {(() => {
                    const name = (
                      <>
                        {depth > 0 && (
                          <span
                            aria-hidden="true"
                            className="-ms-[var(--hui-space-4)] h-3 w-2.5 shrink-0 self-start rounded-es-[3px] border-s border-b border-[var(--hui-color-border-base-secondary)]"
                          />
                        )}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={cn("line-clamp-2 [overflow-wrap:anywhere]", depth === 0 && "[font-weight:var(--hui-font-weight-medium)]", labelText)}>
                            {resource.name}
                          </span>
                          {resource.description && (
                            <span className={cn("truncate text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
                              {resource.description}
                            </span>
                          )}
                        </span>
                      </>
                    )
                    const shared = {
                      ref: register(row, 0),
                      "data-matrix-pos": `${row}:0`,
                      tabIndex: tabIndexAt(row, 0),
                      onFocus: () => setFocus({ row, col: 0 }),
                      style: { paddingInlineStart: `calc(var(--hui-space-2) + ${depth} * var(--hui-space-6))` },
                    }
                    if (editableRoles.length === 0) {
                      return (
                        <span {...shared} className={cn(headerButton, "min-h-10 hover:bg-transparent")}>
                          {name}
                        </span>
                      )
                    }
                    return (
                      <Menu>
                        <MenuTrigger {...shared} className={cn(headerButton, "group/name min-h-10")}>
                          {name}
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)] opacity-0 group-hover/row:opacity-100 group-focus-visible/name:opacity-100 group-data-popup-open/name:opacity-100 pointer-coarse:opacity-100"
                          />
                          <span className="sr-only">, {labels.rowActions(resource.name)}</span>
                        </MenuTrigger>
                        <MenuPopup align="start">
                          {bulkItems((value) =>
                            setValue(
                              setCells(
                                grants,
                                editableRoles.map((role) => ({ roleId: role.id, resourceId: resource.id })),
                                value
                              )
                            )
                          )}
                        </MenuPopup>
                      </Menu>
                    )
                  })()}
                </th>
                {roles.map((role, colIndex) => {
                  const col = colIndex + 1
                  const resolved = resolve(role.id, resource.id)
                  const inherited = resolved.source.kind !== "explicit"
                  const source = sourceText(resolved)
                  const isDirty = dirty.has(cellKey(role.id, resource.id))
                  const canEdit = editable(role)
                  return (
                    <td
                      key={role.id}
                      ref={register(row, col)}
                      role="gridcell"
                      data-slot="permission-matrix-cell"
                      data-matrix-pos={`${row}:${col}`}
                      data-value={getCellValue(grants, role.id, resource.id)}
                      data-effective={resolved.value}
                      data-dirty={isDirty ? "" : undefined}
                      aria-readonly={!canEdit || undefined}
                      tabIndex={tabIndexAt(row, col)}
                      title={source ?? undefined}
                      onFocus={() => setFocus({ row, col })}
                      onClick={() =>
                        changeCell(role, resource.id, cycleCellValue(getCellValue(grants, role.id, resource.id)))
                      }
                      className={cn(
                        "relative h-11 px-[var(--hui-space-2)] text-center align-middle outline-none select-none group-hover/row:bg-[color-mix(in_oklch,var(--hui-color-background-base-primary-hover)_60%,transparent)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[-3px]",
                        canEdit ? "cursor-pointer hover:bg-[var(--hui-color-background-base-primary-hover)]!" : "cursor-default",
                        border
                      )}
                    >
                      <span className="inline-flex items-center justify-center">
                        <PermissionMark value={resolved.value} inherited={inherited} />
                      </span>
                      {isDirty && (
                        <span
                          aria-hidden="true"
                          className="absolute end-[var(--hui-space-3)] top-[var(--hui-space-3)] size-1.5 rounded-full bg-[var(--hui-color-background-accent-emphasis)]"
                        />
                      )}
                      <span className="sr-only">
                        {resolved.value === "allow" ? labels.allow : labels.deny}
                        {source ? `, ${source}` : ""}
                        {isDirty ? `, ${labels.changed}` : ""}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

/** A legend, the count of unsaved changes, and Discard and Save. */
function PermissionMatrixFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { changes, discard, save, saving, disabled, labels } = usePermissionMatrix("PermissionMatrixFooter")
  const count = changes.length

  return (
    <div
      data-slot="permission-matrix-footer"
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-3)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      <ul
        aria-hidden="true"
        className={cn("m-0 flex list-none flex-wrap items-center gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] p-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}
      >
        <li className="inline-flex items-center gap-[var(--hui-space-2)]">
          <span className="scale-[0.84]"><PermissionMark value="allow" inherited={false} /></span>
          {labels.allow}
        </li>
        <li className="inline-flex items-center gap-[var(--hui-space-2)]">
          <span className="scale-[0.84]"><PermissionMark value="deny" inherited={false} /></span>
          {labels.deny}
        </li>
        <li className="inline-flex items-center gap-[var(--hui-space-2)]">
          <span className="scale-[0.84]"><PermissionMark value="allow" inherited /></span>
          {labels.inherit}
        </li>
      </ul>
      <div className="flex flex-wrap items-center gap-[var(--hui-space-4)]">
        <p
          role="status"
          className={cn(
            "m-0 inline-flex items-center gap-[var(--hui-space-2)] tabular-nums",
            count > 0 ? "text-[var(--hui-color-foreground-base-primary)]" : "text-[var(--hui-color-foreground-base-secondary)]",
            labelText
          )}
        >
          {count > 0 && (
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--hui-color-background-accent-emphasis)]" />
          )}
          {count > 0 ? labels.changes(count) : labels.noChanges}
        </p>
        {count > 0 && (
          <div className="flex items-center gap-[var(--hui-space-2)]">
            <Button size="sm" variant="ghost" onClick={discard} disabled={disabled || saving}>
              {labels.discard}
            </Button>
            {save && (
              <Button size="sm" onClick={save} disabled={disabled || saving} aria-busy={saving || undefined}>
                {labels.save}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { PermissionMatrix, PermissionMatrixFooter, PermissionMatrixGrid }
