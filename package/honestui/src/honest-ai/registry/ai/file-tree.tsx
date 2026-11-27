"use client"

import * as React from "react"
import {
  ChevronRight as ChevronRightIcon,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"

export type FileTreeChange = "added" | "modified" | "deleted"

export type FileTreeNode = {
  name: string
  /** A stable id. Defaults to the path from the root, such as `src/app/page.tsx`. */
  id?: string
  /** A folder's entries. A node with `children`, even empty, is a folder. */
  children?: FileTreeNode[]
  /** How the agent changed the file. */
  change?: FileTreeChange
}

export type FileTreeLabels = {
  tree: string
  added: string
  modified: string
  deleted: string
  /** Read after a collapsed folder that holds changes. */
  hasChanges: string
}

export const defaultFileTreeLabels: FileTreeLabels = {
  tree: "Files",
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  hasChanges: "Contains changes",
}

const changeMark: Record<FileTreeChange, { letter: string; className: string }> = {
  added: { letter: "A", className: "text-[var(--hui-color-foreground-success-primary-hover)]" },
  modified: { letter: "M", className: "text-[var(--hui-color-foreground-attention-primary-hover)]" },
  deleted: { letter: "D", className: "text-[var(--hui-color-foreground-danger-primary)]" },
}

type FlatItem = {
  id: string
  node: FileTreeNode
  level: number
  parentId: string | null
  folder: boolean
  setSize: number
  posInSet: number
  changed: boolean
}

function hasChange(node: FileTreeNode): boolean {
  return Boolean(node.change) || Boolean(node.children?.some(hasChange))
}

/** Every node, in order, with its id and position. Used for keyboard movement. */
function flatten(nodes: FileTreeNode[], level = 1, parentId: string | null = null, out: FlatItem[] = []) {
  nodes.forEach((node, index) => {
    const id = node.id ?? (parentId ? `${parentId}/${node.name}` : node.name)
    const folder = node.children !== undefined
    out.push({ id, node, level, parentId, folder, setSize: nodes.length, posInSet: index + 1, changed: hasChange(node) })
    if (node.children) flatten(node.children, level + 1, id, out)
  })
  return out
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = value !== undefined ? value : uncontrolled
  const set = React.useCallback(
    (next: T) => {
      if (value === undefined) setUncontrolled(next)
      onChange?.(next)
    },
    [value, onChange]
  )
  return [current, set] as const
}

export type FileTreeProps = Omit<React.ComponentProps<"div">, "children" | "onSelect"> & {
  nodes: FileTreeNode[]
  /** A heading above the tree, such as the project name. Without it, the tree has no header. */
  title?: React.ReactNode
  /** The ids of open folders. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** The id of the chosen node. */
  selected?: string | null
  defaultSelected?: string | null
  /** Runs when a file or a folder is chosen, by click, Enter, or Space. */
  onSelect?: (id: string, node: FileTreeNode) => void
  labels?: Partial<FileTreeLabels>
}

/**
 * A folder tree with open and closed folders, a chosen file, and a letter for
 * each file the agent added, modified, or deleted.
 */
function FileTree({
  nodes,
  title,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  labels: labelsProp,
  className,
  ...props
}: FileTreeProps) {
  const labels = React.useMemo(() => ({ ...defaultFileTreeLabels, ...labelsProp }), [labelsProp])
  const [expandedList, setExpandedList] = useControllable(expandedProp, defaultExpanded, onExpandedChange)
  const [selected, setSelected] = useControllable<string | null>(selectedProp, defaultSelected)
  const expanded = React.useMemo(() => new Set(expandedList), [expandedList])
  const all = React.useMemo(() => flatten(nodes), [nodes])
  const byId = React.useMemo(() => new Map(all.map((item) => [item.id, item])), [all])

  // Only items under open folders can be reached.
  const visible = React.useMemo(() => {
    const out: FlatItem[] = []
    for (const item of all) {
      let parent = item.parentId
      let shown = true
      while (parent) {
        if (!expanded.has(parent)) {
          shown = false
          break
        }
        parent = byId.get(parent)?.parentId ?? null
      }
      if (shown) out.push(item)
    }
    return out
  }, [all, byId, expanded])

  // One item holds the tab stop: the focused one, else the chosen one, else the first.
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const tabId =
    (activeId && visible.some((item) => item.id === activeId) && activeId) ||
    (selected && visible.some((item) => item.id === selected) && selected) ||
    visible[0]?.id
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>())
  const focusItem = (id: string | undefined) => {
    if (!id) return
    setActiveId(id)
    itemRefs.current.get(id)?.focus()
  }

  const setOpen = (id: string, open: boolean) => {
    if (expanded.has(id) === open) return
    setExpandedList(open ? [...expandedList, id] : expandedList.filter((value) => value !== id))
  }
  const choose = (item: FlatItem) => {
    setSelected(item.id)
    onSelect?.(item.id, item.node)
  }

  const typeahead = React.useRef({ text: "", timer: 0 })
  React.useEffect(() => () => window.clearTimeout(typeahead.current.timer), [])

  const onKeyDown = (event: React.KeyboardEvent, item: FlatItem) => {
    const index = visible.findIndex((entry) => entry.id === item.id)
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const back = rtl ? "ArrowRight" : "ArrowLeft"
    let handled = true
    switch (event.key) {
      case "ArrowDown":
        focusItem(visible[index + 1]?.id)
        break
      case "ArrowUp":
        focusItem(visible[index - 1]?.id)
        break
      case "Home":
        focusItem(visible[0]?.id)
        break
      case "End":
        focusItem(visible.at(-1)?.id)
        break
      case forward:
        if (item.folder) {
          if (!expanded.has(item.id)) setOpen(item.id, true)
          else if (item.node.children?.length) focusItem(visible[index + 1]?.id)
        }
        break
      case back:
        if (item.folder && expanded.has(item.id)) setOpen(item.id, false)
        else if (item.parentId) focusItem(item.parentId)
        break
      case "Enter":
      case " ":
        choose(item)
        if (item.folder && event.key === "Enter") setOpen(item.id, !expanded.has(item.id))
        break
      case "*": {
        const siblings = all.filter((entry) => entry.parentId === item.parentId && entry.folder && !expanded.has(entry.id))
        if (siblings.length) setExpandedList([...expandedList, ...siblings.map((entry) => entry.id)])
        break
      }
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const state = typeahead.current
          window.clearTimeout(state.timer)
          state.text += event.key.toLowerCase()
          state.timer = window.setTimeout(() => (state.text = ""), 500)
          // A repeated letter steps through names that start with it; a word
          // keeps matching from the focused item.
          const repeated = new Set(state.text).size === 1
          const query = repeated ? state.text[0] : state.text
          const start = repeated ? index + 1 : index
          const pool = [...visible.slice(start), ...visible.slice(0, start)]
          const match = pool.find((entry) => entry.node.name.toLowerCase().startsWith(query))
          focusItem(match?.id)
        } else {
          handled = false
        }
    }
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const renderNodes = (list: FileTreeNode[], parentId: string | null): React.ReactNode =>
    list.map((node) => {
      const id = node.id ?? (parentId ? `${parentId}/${node.name}` : node.name)
      const item = byId.get(id)
      if (!item) return null
      const open = item.folder && expanded.has(id)
      const isSelected = selected === id
      const Icon = item.folder ? (open ? FolderOpenIcon : FolderIcon) : FileIcon
      const mark = node.change ? changeMark[node.change] : undefined
      return (
        <li
          key={id}
          ref={(element) => {
            if (element) itemRefs.current.set(id, element)
            else itemRefs.current.delete(id)
          }}
          role="treeitem"
          data-slot="file-tree-item"
          data-change={node.change}
          aria-level={item.level}
          aria-setsize={item.setSize}
          aria-posinset={item.posInSet}
          aria-selected={isSelected}
          aria-expanded={item.folder ? open : undefined}
          tabIndex={tabId === id ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setActiveId(id)
          }}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget) onKeyDown(event, item)
          }}
          onClick={(event) => {
            event.stopPropagation()
            focusItem(id)
            choose(item)
            if (item.folder) setOpen(id, !open)
          }}
          className="group/item list-none outline-none"
        >
          <div
            style={{ paddingInlineStart: `calc(var(--hui-space-3) + ${(item.level - 1) * 16}px)` }}
            className={cn(
              "mx-[var(--hui-space-2)] flex min-h-7 min-w-0 cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-1)] pe-[var(--hui-space-3)] select-none",
              "hover:bg-[var(--hui-color-background-base-primary-hover)]",
              isSelected && "bg-[var(--hui-color-background-neutral-secondary)] hover:bg-[var(--hui-color-background-neutral-secondary-hover)]",
              "group-focus-visible/item:[outline:var(--hui-focus-ring)] group-focus-visible/item:outline-offset-[var(--hui-focus-ring-offset-inset)]"
            )}
          >
            <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
              {item.folder && (
                <ChevronRightIcon
                  className={cn(
                    "size-3.5 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform rtl:-scale-x-100",
                    open && "rotate-90 rtl:scale-x-100"
                  )}
                />
              )}
            </span>
            <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
            <span
              className={cn(
                "min-w-0 flex-1 truncate [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
                node.change === "deleted"
                  ? "text-[var(--hui-color-foreground-base-secondary)] line-through decoration-[var(--hui-color-foreground-base-tertiary)]"
                  : "text-[var(--hui-color-foreground-base-primary)]"
              )}
            >
              {node.name}
            </span>
            {mark && (
              <span
                data-slot="file-tree-change"
                className={cn(
                  "w-3 shrink-0 text-center font-mono font-medium [font-size:var(--hui-font-size-mono-small)] [line-height:var(--hui-line-height-mono-small)]",
                  mark.className
                )}
              >
                <span aria-hidden="true">{mark.letter}</span>
                <span className="sr-only">{labels[node.change!]}</span>
              </span>
            )}
            {!mark && item.folder && !open && item.changed && (
              <span className="flex w-3 shrink-0 justify-center">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--hui-color-foreground-base-tertiary)]" />
                <span className="sr-only">{labels.hasChanges}</span>
              </span>
            )}
          </div>
          {open && node.children && node.children.length > 0 && (
            <ul role="group" className="m-0 p-0">
              {renderNodes(node.children, id)}
            </ul>
          )}
        </li>
      )
    })

  const titleId = React.useId()

  return (
    <div
      data-slot="file-tree"
      className={cn(
        "not-prose w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      {title && (
        <div
          id={titleId}
          className="flex min-h-[var(--hui-space-10)] min-w-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] font-medium [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
        >
          {title}
        </div>
      )}
      <ul
        role="tree"
        aria-label={title ? undefined : labels.tree}
        aria-labelledby={title ? titleId : undefined}
        className="m-0 p-0 py-[var(--hui-space-2)]"
      >
        {renderNodes(nodes, null)}
      </ul>
    </div>
  )
}

export { FileTree }
