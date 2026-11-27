"use client";

import {
  Reorder,
  useDragControls,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface ReorderListAnnouncements {
  pickedUp: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  cancelled: (label: string, position: number, total: number) => string;
}

export interface ReorderListItemState {
  /** The item is being dragged or has been picked up from the keyboard. */
  active: boolean;
  /** Zero-based position in the list. */
  index: number;
}

export interface ReorderListProps<T> {
  /** Items in their current order. */
  items: T[];
  /** Called with the items in their new order. */
  onReorder: (items: T[]) => void;
  /** A stable key for each item. */
  getKey: (item: T) => string;
  /** Plain-text name for each item, used for the handle label and announcements. */
  getLabel: (item: T) => string;
  /** Content of each row. The drag handle is drawn before it. */
  renderItem: (item: T, state: ReorderListItemState) => ReactNode;
  /**
   * Drag only from the handle. When false, the whole row drags with a pointer.
   * Keyboard reordering always uses the handle. Default true.
   */
  handle?: boolean;
  disabled?: boolean;
  /** Accessible name of the list. */
  label?: string;
  /** Text read for each handle, after its label. */
  instructions?: string;
  /** Replace any announcement made while moving items. */
  announcements?: Partial<ReorderListAnnouncements>;
  /** Accessible name of each handle. Default "Reorder {label}". */
  getHandleLabel?: (label: string) => string;
  className?: string;
  /** Classes for each row. */
  itemClassName?: string;
}

const defaultAnnouncements: ReorderListAnnouncements = {
  pickedUp: (label, position, total) => `Picked up ${label}. Position ${position} of ${total}.`,
  moved: (label, position, total) => `${label} moved to position ${position} of ${total}.`,
  dropped: (label, position, total) => `Dropped ${label} at position ${position} of ${total}.`,
  cancelled: (label, position, total) => `Cancelled. ${label} returned to position ${position} of ${total}.`,
};

const DEFAULT_INSTRUCTIONS =
  "Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, and Escape to cancel.";

const LIFT_SHADOW = "0 14px 30px -12px rgb(0 0 0 / 0.28), 0 4px 10px -6px rgb(0 0 0 / 0.16)";
const REST_SHADOW = "0 0 0 0 rgb(0 0 0 / 0)";

function moveItem<T>(items: T[], from: number, to: number) {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ReorderList<T>({
  items,
  onReorder,
  getKey,
  getLabel,
  renderItem,
  handle = true,
  disabled = false,
  label,
  instructions = DEFAULT_INSTRUCTIONS,
  announcements,
  getHandleLabel = (name) => `Reorder ${name}`,
  className,
  itemClassName,
}: ReorderListProps<T>) {
  const reduce = useReducedMotion() ?? false;
  const instructionsId = useId();
  const text = { ...defaultAnnouncements, ...announcements };
  const [message, setMessage] = useState("");
  // The key of the item picked up from the keyboard, with where it started.
  const [picked, setPicked] = useState<{ key: string; from: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const handlesRef = useRef(new Map<string, HTMLButtonElement>());
  // Set while a key press moves an item, so the blur from the row moving in the DOM is not read as leaving.
  const movingRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Moving a row can take focus away from its handle. Put it back.
  useLayoutEffect(() => {
    if (!picked) {
      movingRef.current = false;
      return;
    }
    const button = handlesRef.current.get(picked.key);
    if (button && document.activeElement !== button) button.focus({ preventScroll: true });
    movingRef.current = false;
  }, [items, picked]);

  const total = items.length;
  const indexOf = (key: string) => itemsRef.current.findIndex((item) => getKey(item) === key);
  // Repeating the same sentence would be skipped by some screen readers, so a
  // zero-width space alternates on the end of each message.
  const announce = (value: string) => setMessage((previous) => (previous.endsWith("​") ? value : `${value}​`));

  const drop = (key: string) => {
    const index = indexOf(key);
    const item = itemsRef.current[index];
    setPicked(null);
    if (item !== undefined) announce(text.dropped(getLabel(item), index + 1, total));
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, item: T) => {
    if (disabled) return;
    const key = getKey(item);
    const index = indexOf(key);
    const name = getLabel(item);
    const isPicked = picked?.key === key;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (isPicked) {
        drop(key);
      } else {
        setPicked({ key, from: index });
        announce(text.pickedUp(name, index + 1, total));
      }
      return;
    }
    if (!isPicked) return;

    if (event.key === "Escape") {
      event.preventDefault();
      const from = picked.from;
      setPicked(null);
      if (index !== from) {
        movingRef.current = true;
        const restored = moveItem(itemsRef.current, index, from);
        itemsRef.current = restored;
        onReorder(restored);
        // Focus stays on the handle; nothing is picked up anymore.
        requestAnimationFrame(() => handlesRef.current.get(key)?.focus({ preventScroll: true }));
      }
      announce(text.cancelled(name, from + 1, total));
      return;
    }

    let target: number | null = null;
    if (event.key === "ArrowUp") target = index - 1;
    else if (event.key === "ArrowDown") target = index + 1;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = total - 1;
    if (target === null) return;
    event.preventDefault();
    target = Math.min(total - 1, Math.max(0, target));
    if (target === index) return;
    const next = moveItem(itemsRef.current, index, target);
    itemsRef.current = next;
    movingRef.current = true;
    onReorder(next);
    announce(text.moved(name, target + 1, total));
  };

  const layoutTransition: Transition = reduce ? { duration: 0 } : SPRING_LAYOUT;

  return (
    <>
      <Reorder.Group
        as="ul"
        axis="y"
        values={items}
        onReorder={(next) => {
          if (!disabled) onReorder(next);
        }}
        aria-label={label}
        data-slot="reorder-list"
        className={cn("m-0 flex list-none flex-col gap-2 p-0", className)}
      >
        {items.map((item, index) => {
          const key = getKey(item);
          return (
            <ReorderListRow
              key={key}
              item={item}
              index={index}
              active={picked?.key === key || dragging === key}
              handle={handle}
              disabled={disabled}
              transition={layoutTransition}
              reduce={reduce}
              handleLabel={getHandleLabel(getLabel(item))}
              instructionsId={instructionsId}
              handleRef={(node) => {
                if (node) handlesRef.current.set(key, node);
                else handlesRef.current.delete(key);
              }}
              itemClassName={itemClassName}
              onHandleKeyDown={(event) => onHandleKeyDown(event, item)}
              onHandleBlur={() => {
                // Leaving a picked-up item drops it where it is.
                if (picked?.key === key && !movingRef.current) drop(key);
              }}
              onDragStart={() => {
                setPicked(null);
                setDragging(key);
              }}
              onDragEnd={() => {
                setDragging(null);
                drop(key);
              }}
            >
              {renderItem(item, { active: picked?.key === key || dragging === key, index })}
            </ReorderListRow>
          );
        })}
      </Reorder.Group>
      <span id={instructionsId} hidden>
        {instructions}
      </span>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </>
  );
}

interface ReorderListRowProps<T> {
  item: T;
  index: number;
  active: boolean;
  handle: boolean;
  disabled: boolean;
  transition: Transition;
  reduce: boolean;
  handleLabel: string;
  instructionsId: string;
  handleRef: (node: HTMLButtonElement | null) => void;
  itemClassName?: string;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onHandleBlur: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: ReactNode;
}

function ReorderListRow<T>({
  item,
  active,
  handle,
  disabled,
  transition,
  reduce,
  handleLabel,
  instructionsId,
  handleRef,
  itemClassName,
  onHandleKeyDown,
  onHandleBlur,
  onDragStart,
  onDragEnd,
  children,
}: ReorderListRowProps<T>) {
  const controls = useDragControls();
  const startDrag = (event: PointerEvent) => {
    if (disabled) return;
    event.preventDefault();
    controls.start(event);
  };

  return (
    <Reorder.Item
      as="li"
      value={item}
      dragListener={!handle && !disabled}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      layout="position"
      transition={transition}
      animate={{
        scale: active && !reduce ? 1.015 : 1,
        boxShadow: active ? LIFT_SHADOW : REST_SHADOW,
      }}
      data-slot="reorder-list-item"
      data-active={active ? "" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border border-border bg-card p-2 pe-3 text-card-foreground select-none",
        active ? "z-10 border-foreground/15" : "z-0",
        !handle && !disabled && "cursor-grab active:cursor-grabbing",
        itemClassName,
      )}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={handleLabel}
        aria-describedby={instructionsId}
        aria-pressed={active}
        disabled={disabled}
        onPointerDown={handle ? startDrag : undefined}
        onKeyDown={onHandleKeyDown}
        onBlur={onHandleBlur}
        data-slot="reorder-list-handle"
        className={cn(
          "grid size-7 shrink-0 touch-none place-items-center rounded-md text-muted-foreground transition-colors outline-none",
          "hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          "aria-pressed:bg-accent aria-pressed:text-foreground disabled:pointer-events-none disabled:opacity-50",
          handle && "cursor-grab active:cursor-grabbing",
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <circle cx="5.5" cy="3.5" r="1.25" />
          <circle cx="10.5" cy="3.5" r="1.25" />
          <circle cx="5.5" cy="8" r="1.25" />
          <circle cx="10.5" cy="8" r="1.25" />
          <circle cx="5.5" cy="12.5" r="1.25" />
          <circle cx="10.5" cy="12.5" r="1.25" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}
