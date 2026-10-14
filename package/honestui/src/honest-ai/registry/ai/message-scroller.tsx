"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ComponentPropsWithRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Source components: beui.dev/components/agents/message-scroller.
// Tailwind semantic colors use the host's background, foreground, card,
// card-foreground, border, muted-foreground and ring tokens.
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
export const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;
export const SPRING_SWAP = { type: "spring", stiffness: 460, damping: 30, mass: 0.55 } as const;
export const SPRING_PANEL = { type: "spring", stiffness: 420, damping: 40, mass: 0.5 } as const;
export const SPRING_LAYOUT = { type: "spring", stiffness: 360, damping: 32, mass: 0.6 } as const;
export const SPRING_MOUSE = { stiffness: 200, damping: 15, mass: 0.3 } as const;
export const SPRING_GLIDE = { stiffness: 700, damping: 50, mass: 0.5 } as const;

export type DismissBehavior = "pass-through" | "consume";
export interface DismissOptions {
  behavior?: DismissBehavior;
  escape?: boolean;
  ignore?: (target: Element) => boolean;
}

const openScopes = new Set<(target: Element) => boolean>();

function claimedByAnotherScope(self: (target: Element) => boolean, target: Element) {
  for (const scope of openScopes) {
    if (scope !== self && scope(target)) return true;
  }
  return false;
}

// A consumed dismissal must swallow the click even after its overlay unmounts.
// Release on the next gesture or key if the original gesture never clicks.
function consumeActivation(source: Event) {
  const swallow = (event: globalThis.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    release();
  };
  const restart = (event: Event) => {
    if (event !== source) release();
  };
  const release = () => {
    window.removeEventListener("click", swallow, true);
    window.removeEventListener("pointerdown", restart, true);
    window.removeEventListener("pointercancel", restart, true);
    window.removeEventListener("keydown", release, true);
  };
  window.addEventListener("click", swallow, true);
  window.addEventListener("pointerdown", restart, true);
  window.addEventListener("pointercancel", restart, true);
  window.addEventListener("keydown", release, true);
}

/** Keep onDismiss and ignore stable, for example with useCallback. */
export function useDismiss(
  open: boolean,
  onDismiss: () => void,
  ref: RefObject<HTMLElement | SVGElement | null> | null,
  { behavior = "pass-through", escape: dismissOnEscape = true, ignore }: DismissOptions = {},
) {
  useEffect(() => {
    if (!open) return;
    const inside = (target: Element) =>
      Boolean(ref?.current?.contains(target)) || Boolean(ignore?.(target));
    const onKey = (event: KeyboardEvent) => {
      if (dismissOnEscape && event.key === "Escape") onDismiss();
    };
    const onPointer = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || inside(target)) return;
      if (behavior === "consume" && !claimedByAnotherScope(inside, target)) {
        consumeActivation(event);
      }
      onDismiss();
    };
    openScopes.add(inside);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      openScopes.delete(inside);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, onDismiss, ref, behavior, dismissOnEscape, ignore]);
}

interface BoundaryEvent {
  pointerId: number;
  pointerType: string;
  buttons: number;
}
export interface HoverGesture {
  enter: (event: BoundaryEvent) => boolean;
  leave: (event: BoundaryEvent) => boolean;
}

/** Pair each leave with its enter: pen contact must not tear down a tap. */
export function useHoverGesture(): HoverGesture {
  const contact = useRef(new Set<number>());
  return useMemo(() => ({
    enter: (event) => {
      if (isHoveringPointer(event)) {
        contact.current.delete(event.pointerId);
        return true;
      }
      contact.current.add(event.pointerId);
      return false;
    },
    leave: (event) => {
      const arrivedInContact = contact.current.delete(event.pointerId);
      return !arrivedInContact && event.pointerType !== "touch";
    },
  }), []);
}

export interface TapRecord<S> {
  pointerType: string;
  state: S;
}
export interface TapGesture<S> {
  start: (event: { pointerType: string }, state: S) => void;
  take: () => TapRecord<S> | null;
  drop: () => void;
}

/** Wire drop to pointercancel and keydown so keyboard clicks cannot inherit a tap. */
export function useTapGesture<S>(): TapGesture<S> {
  const record = useRef<TapRecord<S> | null>(null);
  return useMemo(() => ({
    start: (event, state) => {
      record.current = { pointerType: event.pointerType, state };
    },
    take: () => {
      const spent = record.current;
      record.current = null;
      return spent;
    },
    drop: () => { record.current = null; },
  }), []);
}

export function getFaviconUrl(value: string) {
  try {
    return new URL("/favicon.ico", value).toString();
  } catch {
    return null;
  }
}

/** decode also catches images that failed before hydration attached onError. */
export function useFavicon(url?: string) {
  const resolved = url ? getFaviconUrl(url) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (!img || !src) return;
    let released = false;
    img.decode().catch(() => {
      if (!released) setFailedSrc(src);
    });
    return () => { released = true; };
  }, [src]);
  return { src, ref };
}

export function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return canHover;
}

// Shared touch primitives. iOS and iPadOS run their own gestures on top of the
// page — the long-press selection callout and the selection it drags in with
// it — and they win: once the platform claims a touch it cancels ours
// mid-gesture, so a press-and-hold or a drag simply dies. Surfaces that own
// their gesture have to opt out.
//
// What the two classes below cover, precisely:
// - `-webkit-touch-callout: none` stops iOS's long-press callout. WebKit-only:
//   it is not a property other engines have, so it is inert everywhere else.
// - `user-select: none` stops the long-press selection on every engine,
//   Android included, and stops a drag from painting a selection under the
//   cursor. It is inherited, so it reaches every descendant — which is why the
//   two classes differ only in whether they apply it unconditionally.
// What neither covers:
// - Chrome for Android's long-press menu on a link or an image. No CSS
//   suppresses it; a gesture surface that wraps one needs its own
//   `onContextMenu` with `preventDefault()`.
// - The native drag of an `<img>` or `<a>` descendant. `-webkit-user-drag` is
//   not inherited and plain divs and buttons are not drag sources, so setting
//   it on the surface does nothing — the child itself needs `draggable={false}`.

/**
 * Classes for a surface that *is* the control: a thumb, a drum, a stage, a
 * handle, a hold button. Selection is suppressed on every input, because a
 * drag that highlights the control's own label is wrong on a mouse too.
 * Compose with `touch-none` when the surface also owns the scroll axis — leave
 * it off when the page must still scroll from there.
 */
export const TOUCH_GESTURE_CLASS = "select-none [-webkit-touch-callout:none]";

/**
 * The same opt-out for a gesture surface that wraps content the consumer owns:
 * a scroller, a context-menu trigger, a sheet header, a list row. Selection is
 * suppressed only where the platform runs its own press gestures — a coarse
 * pointer — so a mouse user can still select and copy that content. If the
 * gesture itself would paint a selection under the cursor, add `select-none`
 * for the duration of the gesture rather than reaching for
 * `TOUCH_GESTURE_CLASS`.
 *
 * `pointer: coarse` describes the *primary* pointer and nothing else, so a
 * hybrid machine reads it wrong in both directions: a tablet with a mouse
 * plugged in keeps touch as primary and loses mouse selection, and a laptop
 * with a touchscreen keeps the mouse as primary and leaves selection live
 * under a finger. No media query can answer per interaction — the query is
 * about the device, and the question is about the gesture in progress. The
 * default stays here because it is right on the machines that are one thing or
 * the other, and losing a selection is a nuisance; where the miss costs a
 * *gesture* instead, the surface pairs it with `holdSelection` on the press.
 */
export const TOUCH_GESTURE_CONTENT_CLASS =
  "[-webkit-touch-callout:none] pointer-coarse:select-none";

/**
 * Suppress selection on `element` for as long as a gesture is running on it,
 * whatever the primary pointer of the machine happens to be. Returns the
 * release. Inline, so it wins over the class above and is gone again the
 * moment the gesture ends.
 *
 * For the press gestures a native selection would otherwise steal — a
 * long-press that opens a menu. Elsewhere prefer the classes: a surface that
 * takes selection away for the whole session is a surface whose text nobody
 * can copy.
 */
export function holdSelection(element: HTMLElement) {
  element.style.setProperty("user-select", "none");
  element.style.setProperty("-webkit-user-select", "none");
  return () => {
    element.style.removeProperty("user-select");
    element.style.removeProperty("-webkit-user-select");
  };
}

/**
 * Pointer capture, best effort. WebKit throws `NotFoundError` when the pointer
 * is already gone by the time the handler runs — routine on iOS, where the
 * system can claim the touch first — and an uncaught throw takes the rest of
 * the handler, the gesture included, down with it. Touch pointers carry
 * implicit capture anyway, so losing it is never fatal.
 */
export function capturePointer(element: Element, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer is no longer active — implicit capture still applies on touch.
  }
}

/** Release a capture taken with `capturePointer`, ignoring a stale pointer. */
export function releasePointer(element: Element, pointerId: number) {
  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // Capture was already dropped by the browser.
  }
}

/**
 * Whether this event came from a pointer that is *hovering*: not a touch, and
 * not currently pressed. Which input the user is holding right now is not
 * something a device capability can answer — a touchscreen laptop hovers and
 * taps, and iPadOS reports a fine hovering pointer for a finger — so both
 * paths stay live and each handler branches on the event it was given.
 *
 * A pen resting on the glass is making contact, not hovering: `buttons` is the
 * tell, and it sends a pen tap down the same route a finger takes.
 *
 * This answers what an *enter* asks. A leave is the other half of a pair and
 * has to be read against the enter that started it — `useHoverGesture` in
 * `lib/hooks/use-hover-gesture` does that, and hover surfaces should use it
 * rather than asking this question twice.
 */
export const isHoveringPointer = (event: {
  pointerType: string;
  buttons: number;
}) => event.pointerType !== "touch" && event.buttons === 0;

export interface PreviewRailItem {
  id: string;
  label: string;
  ariaLabel?: string;
  description?: ReactNode;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
}

export interface PreviewRailProps {
  items: PreviewRailItem[];
  label?: string;
  orientation?: "vertical" | "horizontal";
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  onItemSelect?: (item: PreviewRailItem) => void;
  renderPreview?: (item: PreviewRailItem) => ReactNode;
  showPreview?: boolean;
  previewSide?: "before" | "after";
  highlightActive?: boolean;
  itemSize?: number;
  children?: ReactNode;
  className?: string;
  railClassName?: string;
  previewContainerClassName?: string;
  previewClassName?: string;
}

function DefaultPreview({ item }: { item: PreviewRailItem }) {
  return (
    <div
      data-slot="preview-rail-card"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <p
        data-slot="preview-rail-title"
        className="font-medium text-card-foreground"
      >
        {item.label}
      </p>
      {item.description ? (
        <div
          data-slot="preview-rail-description"
          className="mt-1 text-sm leading-6 text-muted-foreground"
        >
          {item.description}
        </div>
      ) : null}
    </div>
  );
}

export function PreviewRail({
  items,
  label = "Section navigation",
  orientation = "vertical",
  activeId,
  defaultActiveId,
  onActiveChange,
  onItemSelect,
  renderPreview,
  showPreview = true,
  previewSide = "after",
  highlightActive = false,
  itemSize = 24,
  children,
  className,
  railClassName,
  previewContainerClassName,
  previewClassName,
}: PreviewRailProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalActiveId, setInternalActiveId] = useState(
    defaultActiveId ?? items[0]?.id ?? "",
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // A finger cannot hover, so a tap lights the tick instead. Kept apart from
  // the hovered one: they end in different ways, and a stray mouse move must
  // not clear a tick the keyboard or a tap chose.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // A click carries no pointerType, so the pointerdown before it is what says
  // whether the activation was a tap. Keyboard activation has none at all.
  const tap = useTapGesture<boolean>();
  const hover = useHoverGesture();

  const clearPinned = useCallback(() => setPinnedId(null), []);

  // The next tap outside the rail stands in for the pointer leaving it. The
  // card is a preview, so that tap passes through to whatever it landed on.
  useDismiss(pinnedId !== null, clearPinned, rootRef);

  const requestedActiveId = activeId ?? internalActiveId;
  const selectedId = items.some((item) => item.id === requestedActiveId)
    ? requestedActiveId
    : (items[0]?.id ?? "");
  const displayedId = hoveredId ?? pinnedId ?? focusedId ?? "";
  const highlightedId = displayedId || (highlightActive ? selectedId : "");
  const displayedIndex = items.findIndex((item) => item.id === highlightedId);
  const rowTemplate = items.length
    ? `repeat(${items.length}, ${itemSize}px)`
    : undefined;
  const isHorizontal = orientation === "horizontal";

  const selectItem = (id: string) => {
    if (activeId === undefined) setInternalActiveId(id);
    onActiveChange?.(id);
  };

  return (
    <motion.div
      layoutRoot
      ref={rootRef}
      onBlur={(event) => {
        // Both tick sources leave with the focus: a tap does not always land
        // focus, but when it does, tabbing away must not strand the card.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedId(null);
          setPinnedId(null);
        }
      }}
      className={cn(
        "isolate relative flex w-full overflow-visible",
        isHorizontal
          ? "min-h-64 flex-col items-center justify-center"
          : "min-h-80",
        className,
      )}
    >
      <nav
        aria-label={label}
        onPointerLeave={(event) => {
          // A touch pointer leaves on lift, which would clear the tick the tap
          // just chose — that one is cleared by the outside tap instead.
          if (hover.leave(event)) setHoveredId(null);
        }}
        style={
          isHorizontal
            ? { gridTemplateColumns: rowTemplate }
            : { gridTemplateRows: rowTemplate }
        }
        className={cn(
          "relative z-10 grid shrink-0",
          isHorizontal
            ? "h-12 w-fit max-w-full self-center justify-center"
            : "w-12 content-center",
          railClassName,
        )}
      >
        {items.map((item, index) => {
          const selected = item.id === selectedId;
          const highlighted = item.id === highlightedId;
          const distance =
            displayedIndex < 0 ? Number.POSITIVE_INFINITY : Math.abs(index - displayedIndex);
          const scale = highlighted
            ? 1
            : distance === 1
              ? 0.68
              : distance === 2
                ? 0.44
                : 0.25;

          const itemContent = (
            <>
              <motion.span
                data-slot="preview-rail-tick"
                aria-hidden="true"
                animate={isHorizontal ? { scaleY: scale } : { scaleX: scale }}
                transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                className={cn(
                  "block bg-current",
                  isHorizontal
                    ? "h-12 w-0.5 origin-bottom"
                    : "h-0.5 w-12 origin-left",
                  highlighted ? "text-foreground" : undefined,
                )}
              />
            </>
          );

          const sharedClassName = cn(
            "relative flex text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isHorizontal
              ? "h-12 w-6 items-end justify-center"
              : "h-6 w-12 items-center",
          );
          const sharedStyle = isHorizontal
            ? { width: itemSize }
            : { height: itemSize };
          const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
            if (hover.enter(event)) setHoveredId(item.id);
          };
          const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
            tap.start(event, pinnedId === item.id);
            setFocusedId(null);
          };
          // A gesture the platform takes away sends no click, and a key press
          // starts an activation that never had a pointer behind it: either
          // one leaves a record the next click would read as a tap of its own.
          const dropGesture = () => tap.drop();
          const handleFocus = (currentTarget: HTMLElement) => {
            if (currentTarget.matches(":focus-visible")) {
              setFocusedId(item.id);
            }
          };
          const handleSelect = (event: MouseEvent<HTMLElement>) => {
            const gesture = tap.take();
            const tapped =
              gesture !== null && gesture.pointerType !== "mouse";

            if (tapped) {
              // A link would otherwise show its preview and leave the page in
              // the same tap, so the card is never read: the first tap lights
              // the tick, the second follows the link.
              if (item.href && !gesture.state) {
                event.preventDefault();
                setPinnedId(item.id);
                return;
              }
              setPinnedId(item.id);
            }

            selectItem(item.id);
            onItemSelect?.(item);
          };

          return item.href ? (
            <a
              key={item.id}
              data-slot="preview-rail-item"
              href={item.href}
              target={item.target}
              rel={
                item.rel ??
                (item.target === "_blank" ? "noreferrer noopener" : undefined)
              }
              aria-label={item.ariaLabel ?? item.label}
              aria-current={selected ? "page" : undefined}
              onPointerEnter={handlePointerEnter}
              onPointerDown={handlePointerDown}
              onPointerCancel={dropGesture}
              onKeyDown={dropGesture}
              onFocus={(event) => handleFocus(event.currentTarget)}
              onClick={handleSelect}
              style={sharedStyle}
              className={sharedClassName}
            >
              {itemContent}
            </a>
          ) : (
            <button
              key={item.id}
              data-slot="preview-rail-item"
              type="button"
              aria-label={item.ariaLabel ?? item.label}
              aria-current={selected ? "location" : undefined}
              onPointerEnter={handlePointerEnter}
              onPointerDown={handlePointerDown}
              onPointerCancel={dropGesture}
              onKeyDown={dropGesture}
              onFocus={(event) => handleFocus(event.currentTarget)}
              onClick={handleSelect}
              style={sharedStyle}
              className={sharedClassName}
            >
              {itemContent}
            </button>
          );
        })}
      </nav>

      {showPreview ? (
        <div
          aria-hidden="true"
          style={
            isHorizontal
              ? { gridTemplateColumns: rowTemplate }
              : { gridTemplateRows: rowTemplate }
          }
          className={cn(
            "pointer-events-none absolute z-50 grid",
            isHorizontal
              ? "top-1/2 left-1/2 h-5 w-fit max-w-full -translate-x-1/2 -translate-y-1/2 justify-center"
              : previewSide === "before"
                ? "inset-y-0 right-16 left-4 content-center"
                : "inset-y-0 right-4 left-16 content-center",
            previewContainerClassName,
          )}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={
                isHorizontal ? { width: itemSize } : { height: itemSize }
              }
              className={cn(
                "relative flex items-center",
                isHorizontal ? "justify-center" : undefined,
              )}
            >
              {item.id === displayedId ? (
                <div
                  className={cn(
                    isHorizontal
                      ? "absolute bottom-12 left-1/2 w-72 -translate-x-1/2"
                      : cn(
                          "w-full max-w-sm",
                          previewSide === "before" && "ml-auto",
                        ),
                    previewClassName,
                  )}
                >
                  <motion.div
                    layoutId={`preview-rail-card-${uid}`}
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={item.id}
                        initial={
                          reduce
                            ? { opacity: 0 }
                            : { opacity: 0, y: 4, filter: "blur(6px)" }
                        }
                        animate={
                          reduce
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0, filter: "blur(0px)" }
                        }
                        exit={
                          reduce
                            ? { opacity: 0 }
                            : {
                                opacity: 0,
                                y: -2,
                                filter: "blur(4px)",
                                transition: {
                                  duration: 0.12,
                                  ease: EASE_OUT,
                                },
                              }
                        }
                        transition={{
                          duration: reduce ? 0 : 0.18,
                          ease: EASE_OUT,
                        }}
                      >
                        {renderPreview ? (
                          renderPreview(item)
                        ) : (
                          <DefaultPreview item={item} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {children ? (
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      ) : null}
    </motion.div>
  );
}

// beui.dev/components/agents/message-scroller


// React 19 callback refs may return cleanup instead of receiving null.
function assignViewportRef(ref: Ref<HTMLElement> | undefined, node: HTMLElement | null) {
  if (typeof ref === "function") return ref(node);
  if (ref) ref.current = node;
}

const PREVIEW_TITLE_LENGTH = 56;
const PREVIEW_DESCRIPTION_LENGTH = 88;

function truncateMessageText(text: string, limit: number) {
  if (text.length <= limit) return text;
  const excerpt = text.slice(0, limit);
  const boundary = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, boundary > limit * 0.65 ? boundary : limit).trim()}…`;
}

function getMessageText(message: HTMLElement) {
  const surface =
    message.querySelector<HTMLElement>('[data-slot="message-bubble-content"]') ??
    message.querySelector<HTMLElement>('[data-slot="message-content"]') ??
    message;
  return (surface.textContent ?? "").replace(/\s+/g, " ").trim();
}

function getMessagePreview(
  message: HTMLElement,
  assistantResponse?: HTMLElement,
) {
  const text = getMessageText(message);
  if (!text) {
    return { label: "Message", description: undefined };
  }

  if (text.length <= PREVIEW_TITLE_LENGTH) {
    const responseText = assistantResponse
      ? getMessageText(assistantResponse)
      : "";
    return {
      label: text,
      description: responseText
        ? truncateMessageText(responseText, PREVIEW_DESCRIPTION_LENGTH)
        : undefined,
    };
  }

  const titleExcerpt = text.slice(0, PREVIEW_TITLE_LENGTH);
  const titleBoundary = titleExcerpt.lastIndexOf(" ");
  const titleEnd =
    titleBoundary > PREVIEW_TITLE_LENGTH * 0.65
      ? titleBoundary
      : PREVIEW_TITLE_LENGTH;
  const label = `${text.slice(0, titleEnd).trim()}…`;
  const responseText = assistantResponse
    ? getMessageText(assistantResponse)
    : text.slice(titleEnd).trim();
  return {
    label,
    description: responseText
      ? truncateMessageText(responseText, PREVIEW_DESCRIPTION_LENGTH)
      : undefined,
  };
}

export interface MessageScrollerProps extends ComponentPropsWithRef<"div"> {
  /** Keep streamed output pinned while the reader remains near the end. */
  followOutput?: boolean;
  /** Distance from the end that still counts as following the output. */
  followThreshold?: number;
  /** Smoothly follow growing content. */
  smooth?: boolean;
  /** Reports when the reader leaves or returns to the live edge. */
  onFollowChange?: (following: boolean) => void;
  /** Accessible label for the scrollable transcript. */
  label?: string;
  /** Marks the transcript as waiting for more streamed content. */
  busy?: boolean;
  /** Adds a compact rail for navigating between rendered Message rows. */
  navigation?: "rail";
  /** Accessible label for the optional message navigation rail. */
  navigationLabel?: string;
  viewportClassName?: string;
  contentClassName?: string;
  railClassName?: string;
  viewportRef?: Ref<HTMLElement>;
  viewportProps?: Omit<
    ComponentPropsWithRef<"section">,
    "children" | "className" | "ref"
  >;
  contentProps?: Omit<
    ComponentPropsWithRef<"div">,
    "children" | "className" | "ref"
  >;
}

export function MessageScroller({
  followOutput = true,
  followThreshold = 56,
  smooth = true,
  onFollowChange,
  label = "Conversation",
  busy,
  navigation,
  navigationLabel = "Message navigation",
  viewportClassName,
  contentClassName,
  railClassName,
  viewportRef: externalViewportRef,
  viewportProps,
  contentProps,
  className,
  children,
  ...props
}: MessageScrollerProps) {
  const reduce = useReducedMotion() ?? false;
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(followOutput);
  const programmaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);
  const railFrameRef = useRef<number | undefined>(undefined);
  const railIdRef = useRef(new WeakMap<HTMLElement, string>());
  const railIdCounterRef = useRef(0);
  const railTargetsRef = useRef(new Map<string, HTMLElement>());
  const [railItems, setRailItems] = useState<PreviewRailItem[]>([]);
  const [activeRailId, setActiveRailId] = useState("");
  const [railOverflowing, setRailOverflowing] = useState(false);
  const {
    onScroll: onViewportScroll,
    onWheel: onViewportWheel,
    onTouchStart: onViewportTouchStart,
    onKeyDown: onViewportKeyDown,
    ...restViewportProps
  } = viewportProps ?? {};

  const setViewportRef = useCallback(
    (node: HTMLElement | null) => {
      viewportRef.current = node;
      const cleanup = assignViewportRef(externalViewportRef, node);
      return () => {
        viewportRef.current = null;
        if (typeof cleanup === "function") cleanup();
        else assignViewportRef(externalViewportRef, null);
      };
    },
    [externalViewportRef],
  );

  const setFollowing = useCallback(
    (next: boolean) => {
      if (followingRef.current === next) return;
      followingRef.current = next;
      onFollowChange?.(next);
    },
    [onFollowChange],
  );

  const updateActiveRailItem = useCallback(() => {
    if (navigation !== "rail") return;
    const viewport = viewportRef.current;
    const targets = [...railTargetsRef.current.entries()];
    if (!viewport || targets.length === 0) return;

    const viewportRect = viewport.getBoundingClientRect();
    if (viewport.scrollTop <= followThreshold) {
      const firstId = targets[0]?.[0] ?? "";
      setActiveRailId((current) => (current === firstId ? current : firstId));
      return;
    }

    const distanceFromEnd =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distanceFromEnd <= followThreshold) {
      const lastId = targets.at(-1)?.[0] ?? "";
      setActiveRailId((current) => (current === lastId ? current : lastId));
      return;
    }

    const viewportCenter = viewportRect.top + viewportRect.height / 2;
    let nearestId = targets[0]?.[0] ?? "";
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const [id, element] of targets) {
      const rect = element.getBoundingClientRect();
      const messageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(messageCenter - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = id;
      }
    }

    setActiveRailId((current) =>
      current === nearestId ? current : nearestId,
    );
  }, [followThreshold, navigation]);

  const syncRailItems = useCallback(() => {
    if (navigation !== "rail") return;
    const content = contentRef.current;
    const viewport = viewportRef.current;
    if (!content || !viewport) return;

    const messages = Array.from(
      content.querySelectorAll<HTMLElement>('[data-slot="message"]'),
    );
    const targets = new Map<string, HTMLElement>();
    const nextItems = messages.map((message, index) => {
      let id = railIdRef.current.get(message);
      if (!id) {
        railIdCounterRef.current += 1;
        id = `message-rail-${railIdCounterRef.current}`;
        railIdRef.current.set(message, id);
      }
      targets.set(id, message);
      const sender = message.dataset.from ?? "conversation";
      const assistantResponse =
        sender === "user"
          ? messages
              .slice(index + 1)
              .find((candidate) => candidate.dataset.from === "assistant")
          : undefined;
      const preview = getMessagePreview(message, assistantResponse);

      return {
        id,
        label: preview.label,
        description: preview.description,
        ariaLabel: `Go to ${sender} message ${index + 1} of ${messages.length}`,
      };
    });

    railTargetsRef.current = targets;
    setRailItems((current) => {
      const unchanged =
        current.length === nextItems.length &&
        current.every(
          (item, index) =>
            item.id === nextItems[index]?.id &&
            item.label === nextItems[index]?.label &&
            item.description === nextItems[index]?.description &&
            item.ariaLabel === nextItems[index]?.ariaLabel,
        );
      return unchanged ? current : nextItems;
    });
    setRailOverflowing(
      viewport.scrollHeight > viewport.clientHeight + 1 && messages.length > 1,
    );
  }, [navigation]);

  const scheduleRailSync = useCallback(() => {
    if (navigation !== "rail") return;
    if (railFrameRef.current) cancelAnimationFrame(railFrameRef.current);
    railFrameRef.current = requestAnimationFrame(() => {
      syncRailItems();
      updateActiveRailItem();
    });
  }, [navigation, syncRailItems, updateActiveRailItem]);

  const scrollToEnd = useCallback((behavior: ScrollBehavior) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    programmaticScrollRef.current = true;
    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, behavior === "smooth" ? 320 : 0);
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || programmaticScrollRef.current) return;

    const distance =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setFollowing(distance <= followThreshold);
    updateActiveRailItem();
  }, [followThreshold, setFollowing, updateActiveRailItem]);

  const leaveLiveEdge = useCallback(() => {
    programmaticScrollRef.current = false;
  }, []);

  useLayoutEffect(() => {
    followingRef.current = followOutput;
    if (!followOutput) return;

    frameRef.current = requestAnimationFrame(() => scrollToEnd("auto"));
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [followOutput, scrollToEnd]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      scheduleRailSync();
      if (!followOutput || !followingRef.current) return;
      scrollToEnd(reduce || !smooth ? "auto" : "smooth");
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, [followOutput, reduce, scheduleRailSync, scrollToEnd, smooth]);

  useEffect(() => {
    if (navigation !== "rail") {
      railTargetsRef.current.clear();
      return;
    }

    const content = contentRef.current;
    const viewport = viewportRef.current;
    if (!content || !viewport) return;

    scheduleRailSync();
    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(scheduleRailSync);
    mutationObserver?.observe(content, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleRailSync);
    resizeObserver?.observe(content);
    resizeObserver?.observe(viewport);

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [navigation, scheduleRailSync]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (railFrameRef.current) cancelAnimationFrame(railFrameRef.current);
    },
    [],
  );

  const scrollToRailItem = useCallback(
    (item: PreviewRailItem) => {
      const viewport = viewportRef.current;
      const target = railTargetsRef.current.get(item.id);
      if (!viewport || !target) return;

      const lastItem = railItems.at(-1)?.id === item.id;
      setActiveRailId(item.id);
      if (lastItem) {
        setFollowing(true);
        scrollToEnd(reduce || !smooth ? "auto" : "smooth");
        return;
      }

      setFollowing(false);
      programmaticScrollRef.current = true;
      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top =
        viewport.scrollTop +
        targetRect.top -
        viewportRect.top -
        (viewport.clientHeight - targetRect.height) / 2;
      const behavior = reduce || !smooth ? "auto" : "smooth";

      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ top, behavior });
      } else {
        viewport.scrollTop = top;
      }
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, behavior === "smooth" ? 320 : 0);
    },
    [railItems, reduce, scrollToEnd, setFollowing, smooth],
  );

  const viewport = (
    <section
      ref={setViewportRef}
      aria-label={label}
      tabIndex={0}
      {...restViewportProps}
      onScroll={(event) => {
        handleScroll();
        onViewportScroll?.(event);
      }}
      onWheel={(event) => {
        leaveLiveEdge();
        onViewportWheel?.(event);
      }}
      onTouchStart={(event) => {
        leaveLiveEdge();
        onViewportTouchStart?.(event);
      }}
      onKeyDown={(event) => {
        if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
          leaveLiveEdge();
        }
        onViewportKeyDown?.(event);
      }}
      className={cn(
        "h-full overflow-y-auto overscroll-contain outline-none [overflow-anchor:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        navigation === "rail"
          ? "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "[scrollbar-gutter:stable]",
        viewportClassName,
        navigation === "rail" && railOverflowing && "pr-10",
      )}
    >
      <div
        ref={contentRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={busy}
        className={contentClassName}
        {...contentProps}
      >
        {children}
      </div>
    </section>
  );

  return (
    <div
      data-slot="message-scroller"
      className={cn("min-h-0", className)}
      {...props}
    >
      {navigation === "rail" ? (
        <PreviewRail
          items={railOverflowing ? railItems : []}
          label={navigationLabel}
          activeId={activeRailId}
          onItemSelect={scrollToRailItem}
          previewSide="before"
          highlightActive
          itemSize={14}
          className="h-full min-h-0 overflow-hidden"
          previewContainerClassName="right-8 left-3"
          previewClassName="mr-1 w-64 max-w-full [&_[data-slot=preview-rail-card]]:h-20 [&_[data-slot=preview-rail-card]]:overflow-hidden [&_[data-slot=preview-rail-card]]:p-3 [&_[data-slot=preview-rail-title]]:line-clamp-1 [&_[data-slot=preview-rail-title]]:text-xs [&_[data-slot=preview-rail-title]]:leading-4 [&_[data-slot=preview-rail-description]]:line-clamp-2 [&_[data-slot=preview-rail-description]]:text-xs [&_[data-slot=preview-rail-description]]:leading-4"
          railClassName={cn(
            "absolute inset-y-3 right-1 w-7 content-center py-1 [&_[data-slot=preview-rail-item]]:w-7 [&_[data-slot=preview-rail-item]]:justify-end [&_[data-slot=preview-rail-tick]]:h-px [&_[data-slot=preview-rail-tick]]:w-4 [&_[data-slot=preview-rail-tick]]:origin-right",
            railOverflowing
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
            railClassName,
          )}
        >
          {viewport}
        </PreviewRail>
      ) : (
        viewport
      )}
    </div>
  );
}
