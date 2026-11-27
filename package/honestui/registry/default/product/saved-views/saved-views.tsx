"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  Lock as LockIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  Star as StarIcon,
  Trash2 as TrashIcon,
  Users as UsersIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

import type {
  SavedView,
  SavedViewChangedPart,
  SavedViewNameError,
  SavedViewState,
  SavedViewsLabels,
} from "./saved-views-types"
import {
  defaultSavedViewsLabels,
  getChangedParts,
  getUniqueViewName,
  normalizeViewName,
  validateViewName,
} from "./saved-views-utils"

export type {
  SavedView,
  SavedViewChangedPart,
  SavedViewFilter,
  SavedViewNameError,
  SavedViewSort,
  SavedViewState,
  SavedViewsLabels,
} from "./saved-views-types"
export {
  areFiltersEqual,
  defaultSavedViewsLabels,
  getChangedParts,
  getUniqueViewName,
  isViewStateEqual,
  normalizeViewName,
  validateViewName,
} from "./saved-views-utils"

/** 12px meta text. */
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
/** 13px control text. */
const controlText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)]"
/** The quiet strip buttons: no feather shadow, 12px medium label. */
const stripButton =
  "shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)]"
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

type Mode = { kind: "idle" } | { kind: "rename" } | { kind: "create" } | { kind: "delete" }

type MaybePromise = void | Promise<void>

export type SavedViewsProps = Omit<React.ComponentProps<"div">, "children"> & {
  views: SavedView[]
  /** The view the table was last loaded from. */
  activeViewId: string
  /** Runs when a view is picked. Apply `view.state` to your table here. */
  onActiveViewChange: (id: string, view: SavedView) => void
  /** What the table shows right now. Compared with the active view to find unsaved changes. */
  currentState: SavedViewState
  /** Replaces the built-in comparison, for state with its own rules. */
  getChanges?:
    ((saved: SavedViewState, current: SavedViewState) => SavedViewChangedPart[]) | undefined
  defaultViewId?: string | undefined
  /** Passing this handler offers "Set as default". */
  onDefaultViewChange?: ((id: string) => void) | undefined
  /** Overwrite the active view with the current state. Passing it shows Save. */
  onSave?: ((id: string, state: SavedViewState) => MaybePromise) | undefined
  /** Create a view from the current state. Passing it shows "Save as new". */
  onSaveAsNew?: ((name: string, state: SavedViewState) => MaybePromise) | undefined
  /** Passing this handler offers "Rename". */
  onRename?: ((id: string, name: string) => MaybePromise) | undefined
  /** Passing this handler offers "Delete view". */
  onDelete?: ((id: string) => MaybePromise) | undefined
  /** Put the table back to the active view. Defaults to re-picking the active view. */
  onDiscard?: ((view: SavedView) => void) | undefined
  disabled?: boolean | undefined
  labels?: Partial<SavedViewsLabels> | undefined
}

function SavedViews({
  views,
  activeViewId,
  onActiveViewChange,
  currentState,
  getChanges = getChangedParts,
  defaultViewId,
  onDefaultViewChange,
  onSave,
  onSaveAsNew,
  onRename,
  onDelete,
  onDiscard,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: SavedViewsProps) {
  const labels = React.useMemo(
    () => ({
      ...defaultSavedViewsLabels,
      ...labelsProp,
      nameErrors: { ...defaultSavedViewsLabels.nameErrors, ...labelsProp?.nameErrors },
    }),
    [labelsProp]
  )
  const activeView = views.find((view) => view.id === activeViewId) ?? views[0]
  const changedParts = React.useMemo(
    () => (activeView ? getChanges(activeView.state, currentState) : []),
    [activeView, currentState, getChanges]
  )
  const dirty = changedParts.length > 0

  const [mode, setMode] = React.useState<Mode>({ kind: "idle" })
  const [pending, setPending] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const statusId = React.useId()

  // Picking another view, or saving, ends any rename or delete in progress.
  const [lastActiveId, setLastActiveId] = React.useState(activeViewId)
  if (lastActiveId !== activeViewId) {
    setLastActiveId(activeViewId)
    if (mode.kind === "rename" || mode.kind === "delete") setMode({ kind: "idle" })
  }

  const returnFocus = React.useCallback(() => {
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  const run = React.useCallback(async (action: () => MaybePromise, after?: () => void) => {
    setFailed(false)
    setPending(true)
    try {
      await action()
      setMode({ kind: "idle" })
      after?.()
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }, [])

  if (!activeView) return null

  const canOverwrite = Boolean(onSave) && !activeView.locked
  const isDefault = (defaultViewId ?? null) === activeView.id
  const busy = disabled || pending

  const cancel = () => {
    setMode({ kind: "idle" })
    setFailed(false)
    returnFocus()
  }

  return (
    <div
      data-slot="saved-views"
      data-dirty={dirty ? "" : undefined}
      className={cn(
        "flex min-h-9 min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      {mode.kind === "rename" || mode.kind === "create" ? (
        <ViewNameForm
          key={mode.kind}
          labels={labels}
          initialName={
            mode.kind === "rename"
              ? activeView.name
              : getUniqueViewName(activeView.name, views, labels.copyName)
          }
          submitLabel={mode.kind === "rename" ? labels.save : labels.saveAsNew}
          pending={pending}
          failed={failed}
          validate={(name) =>
            validateViewName(name, views, mode.kind === "rename" ? activeView.id : undefined)
          }
          onCancel={cancel}
          onSubmit={(name) =>
            run(
              () =>
                mode.kind === "rename"
                  ? onRename?.(activeView.id, name)
                  : onSaveAsNew?.(name, currentState),
              returnFocus
            )
          }
        />
      ) : mode.kind === "delete" ? (
        <DeleteConfirm
          labels={labels}
          name={activeView.name}
          pending={pending}
          failed={failed}
          onCancel={cancel}
          onConfirm={() => run(() => onDelete?.(activeView.id), returnFocus)}
        />
      ) : (
        <>
          <Menu>
            <MenuTrigger
              ref={triggerRef}
              disabled={busy}
              aria-label={`${labels.view}: ${activeView.name}${dirty ? `, ${labels.unsavedSuffix}` : ""}`}
              render={
                <Button
                  variant="link"
                  data-slot="saved-views-trigger"
                  className="-ms-[var(--hui-space-3)] max-w-full gap-[var(--hui-space-3)] px-[var(--hui-space-3)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)]"
                />
              }
            >
              <span className="min-w-0 truncate">{activeView.name}</span>
              {dirty && (
                <span
                  aria-hidden="true"
                  data-slot="saved-views-dirty-dot"
                  className="size-1.5 shrink-0 rounded-full bg-[var(--hui-color-background-accent-emphasis)] forced-colors:bg-[Highlight]"
                />
              )}
              <ChevronDownIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
              />
            </MenuTrigger>
            <MenuPopup align="start" className="min-w-60">
              <MenuGroup>
                <MenuGroupLabel>{labels.views}</MenuGroupLabel>
                <MenuRadioGroup
                  value={activeView.id}
                  onValueChange={(id: string) => {
                    const view = views.find((candidate) => candidate.id === id)
                    if (view) onActiveViewChange(view.id, view)
                  }}
                >
                  {views.map((view) => (
                    <MenuRadioItem
                      key={view.id}
                      value={view.id}
                      closeOnClick
                      data-slot="saved-views-option"
                    >
                      <span className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
                        <span className="min-w-0 flex-1 truncate">{view.name}</span>
                        <ViewMarkers
                          view={view}
                          isDefault={defaultViewId === view.id}
                          labels={labels}
                        />
                      </span>
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
              {(onSaveAsNew || onRename || onDelete || onDefaultViewChange) && <MenuSeparator />}
              {onSaveAsNew && (
                <MenuItem onClick={() => setMode({ kind: "create" })}>
                  <PlusIcon aria-hidden="true" />
                  {labels.saveAsNewEllipsis}
                </MenuItem>
              )}
              {onRename && !activeView.locked && (
                <MenuItem onClick={() => setMode({ kind: "rename" })}>
                  <PencilIcon aria-hidden="true" />
                  {labels.rename}
                </MenuItem>
              )}
              {onDefaultViewChange && !isDefault && (
                <MenuItem onClick={() => onDefaultViewChange(activeView.id)}>
                  <StarIcon aria-hidden="true" />
                  {labels.setDefault}
                </MenuItem>
              )}
              {onDelete && !activeView.locked && (
                <>
                  <MenuSeparator />
                  <MenuItem variant="destructive" onClick={() => setMode({ kind: "delete" })}>
                    <TrashIcon aria-hidden="true" />
                    {labels.delete}
                  </MenuItem>
                </>
              )}
            </MenuPopup>
          </Menu>

          <p
            id={statusId}
            role="status"
            data-slot="saved-views-status"
            className={cn(
              "m-0 min-w-0 flex-1 truncate text-[var(--hui-color-foreground-base-secondary)]",
              metaText
            )}
          >
            {failed
              ? labels.saveFailed
              : pending
                ? labels.saving
                : dirty
                  ? `${labels.unsaved} · ${labels.changedParts(changedParts)}`
                  : ""}
          </p>

          {dirty && (
            <div
              data-slot="saved-views-actions"
              className="flex shrink-0 items-center gap-[var(--hui-space-2)]"
            >
              <Button
                variant="link"
                size="sm"
                disabled={busy}
                className={cn(
                  stripButton,
                  "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]"
                )}
                onClick={() => {
                  setFailed(false)
                  if (onDiscard) onDiscard(activeView)
                  else onActiveViewChange(activeView.id, activeView)
                }}
              >
                {labels.discard}
              </Button>
              {onSaveAsNew && (
                <Button
                  variant={canOverwrite ? "outline" : "default"}
                  size="sm"
                  disabled={busy}
                  className={cn(stripButton, forcedColorsBorder)}
                  onClick={() => setMode({ kind: "create" })}
                >
                  {labels.saveAsNew}
                </Button>
              )}
              {canOverwrite && (
                <Button
                  size="sm"
                  disabled={busy}
                  className={cn(stripButton, forcedColorsBorder)}
                  onClick={() => run(() => onSave?.(activeView.id, currentState))}
                >
                  {labels.save}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ViewMarkers({
  view,
  isDefault,
  labels,
}: {
  view: SavedView
  isDefault: boolean
  labels: SavedViewsLabels
}) {
  if (!isDefault && !view.shared && !view.locked) return null
  return (
    <span className="flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]">
      {isDefault && (
        <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
          {labels.default}
        </span>
      )}
      {view.shared && (
        <>
          <UsersIcon aria-hidden="true" className="size-3.5" />
          <span className="sr-only">, {labels.shared}</span>
        </>
      )}
      {view.locked && (
        <>
          <LockIcon aria-hidden="true" className="size-3.5" />
          <span className="sr-only">, {labels.locked}</span>
        </>
      )}
    </span>
  )
}

function ViewNameForm({
  labels,
  initialName,
  submitLabel,
  pending,
  failed,
  validate,
  onCancel,
  onSubmit,
}: {
  labels: SavedViewsLabels
  initialName: string
  submitLabel: string
  pending: boolean
  failed: boolean
  validate: (name: string) => SavedViewNameError | null
  onCancel: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = React.useState(initialName)
  const [touched, setTouched] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const errorId = React.useId()
  const error = validate(name)
  const showError = touched && error !== null

  React.useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <form
      data-slot="saved-views-name-form"
      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-2)]"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (error === null) onSubmit(normalizeViewName(name))
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <Input
        ref={inputRef}
        size="sm"
        aria-label={labels.viewName}
        aria-invalid={showError || undefined}
        aria-describedby={showError || failed ? errorId : undefined}
        value={name}
        disabled={pending}
        className="w-56 max-w-full"
        onChange={(event) => {
          setName(event.target.value)
          setTouched(true)
        }}
      />
      <Button type="button" variant="link" size="sm" className={stripButton} onClick={onCancel}>
        {labels.cancel}
      </Button>
      <Button
        type="submit"
        size="sm"
        disabled={pending || (touched && error !== null)}
        className={cn(stripButton, forcedColorsBorder)}
      >
        {pending ? labels.saving : submitLabel}
      </Button>
      {(showError || failed) && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            "m-0 basis-full text-[var(--hui-color-foreground-danger-primary)]",
            metaText
          )}
        >
          {failed ? labels.saveFailed : error ? labels.nameErrors[error] : null}
        </p>
      )}
    </form>
  )
}

function DeleteConfirm({
  labels,
  name,
  pending,
  failed,
  onCancel,
  onConfirm,
}: {
  labels: SavedViewsLabels
  name: string
  pending: boolean
  failed: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const titleId = React.useId()

  React.useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-slot="saved-views-delete"
      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <p className={cn("m-0 min-w-0 flex-1", controlText)}>
        <span id={titleId} className="[font-weight:var(--hui-font-weight-medium)]">
          {labels.deleteConfirm(name)}
        </span>{" "}
        <span className="text-[var(--hui-color-foreground-base-secondary)]">
          {failed ? labels.saveFailed : labels.deleteDescription}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-[var(--hui-space-2)]">
        <Button
          ref={cancelRef}
          variant="link"
          size="sm"
          className={stripButton}
          disabled={pending}
          onClick={onCancel}
        >
          {labels.cancel}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className={cn(stripButton, forcedColorsBorder)}
          disabled={pending}
          onClick={onConfirm}
        >
          {labels.delete}
        </Button>
      </div>
    </div>
  )
}

export { SavedViews }
