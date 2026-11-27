"use client";

import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";
import { X } from "honestui/icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type MorphingDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  uid: string;
  titleId: string;
  descriptionId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  reduce: boolean;
};

const MorphingDialogContext = createContext<MorphingDialogContextValue | null>(null);

// Parts render twice: once inside the trigger card and once inside the open
// dialog. Only the dialog copy carries ids for aria-labelledby/describedby.
const InsideContentContext = createContext(false);

function useMorphingDialog(part: string) {
  const context = useContext(MorphingDialogContext);
  if (!context) {
    throw new Error(`${part} must be used within <MorphingDialog>.`);
  }
  return context;
}

/** Shared-element ids are skipped under reduced motion, so the dialog fades instead of morphing. */
function useLayoutId(part: string) {
  const { uid, reduce } = useMorphingDialog(part);
  return reduce ? undefined : `morphing-dialog-${uid}-${part}`;
}

const subscribeNoop = () => () => {};

export interface MorphingDialogProps {
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Transition for the shared-element morph. Defaults to the layout spring. */
  transition?: Transition;
}

export function MorphingDialog({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  transition = SPRING_LAYOUT,
}: MorphingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const uid = useId().replace(/:/g, "");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion() ?? false;

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      uid,
      titleId: `morphing-dialog-${uid}-title`,
      descriptionId: `morphing-dialog-${uid}-description`,
      triggerRef,
      reduce,
    }),
    [open, setOpen, uid, reduce],
  );

  return (
    <MorphingDialogContext.Provider value={value}>
      <MotionConfig transition={reduce ? { duration: 0.18, ease: EASE_OUT } : transition}>
        {children}
      </MotionConfig>
    </MorphingDialogContext.Provider>
  );
}

export interface MorphingDialogTriggerProps
  extends Omit<HTMLMotionProps<"button">, "children" | "layoutId"> {
  children: ReactNode;
}

/** The card that opens the dialog. Its shape morphs into the dialog's container. */
export function MorphingDialogTrigger({
  children,
  className,
  style,
  onClick,
  ...props
}: MorphingDialogTriggerProps) {
  const { open, setOpen, triggerRef } = useMorphingDialog("MorphingDialogTrigger");
  const layoutId = useLayoutId("container");

  return (
    <motion.button
      ref={triggerRef}
      type="button"
      layoutId={layoutId}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(true);
      }}
      style={{ borderRadius: 12, ...style }}
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden border border-border bg-card text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { documentElement, body } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [active]);
}

export interface MorphingDialogContainerProps {
  children: ReactNode;
  className?: string;
  /** Classes for the backdrop. */
  backdropClassName?: string;
}

/**
 * Portals the open dialog to the document body with a backdrop. Clicking the
 * backdrop or pressing Escape closes it.
 */
export function MorphingDialogContainer({
  children,
  className,
  backdropClassName,
}: MorphingDialogContainerProps) {
  const { open, setOpen, triggerRef } = useMorphingDialog("MorphingDialogContainer");
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to the card that opened the dialog.
      trigger?.focus({ preventScroll: true });
    };
  }, [open, setOpen, triggerRef]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <>
          <motion.div
            key="morphing-dialog-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={() => setOpen(false)}
            className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]", backdropClassName)}
          />
          <div
            key="morphing-dialog-position"
            className={cn(
              "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4",
              className,
            )}
          >
            {children}
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export interface MorphingDialogContentProps
  extends Omit<HTMLMotionProps<"div">, "children" | "layoutId"> {
  children: ReactNode;
}

/** The dialog surface. Traps focus while open and labels itself from Title and Description. */
export function MorphingDialogContent({
  children,
  className,
  style,
  ...props
}: MorphingDialogContentProps) {
  const { titleId, descriptionId, reduce } = useMorphingDialog("MorphingDialogContent");
  const layoutId = useLayoutId("container");
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const focusables = () => Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE));
    // Focus the dialog itself first so screen readers announce its name,
    // without jumping the visual focus ring onto the close button.
    content.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === content)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    content.addEventListener("keydown", onKeyDown);
    return () => content.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <InsideContentContext.Provider value>
      <motion.div
        ref={contentRef}
        layoutId={layoutId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        initial={reduce ? { opacity: 0 } : undefined}
        animate={reduce ? { opacity: 1 } : undefined}
        exit={reduce ? { opacity: 0 } : undefined}
        style={{ borderRadius: 16, ...style }}
        className={cn(
          "pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden border border-border bg-card text-left shadow-2xl outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    </InsideContentContext.Provider>
  );
}

export interface MorphingDialogImageProps
  extends Omit<HTMLMotionProps<"img">, "layoutId"> {
  src: string;
  alt: string;
}

/** An image shared between the card and the dialog. */
export function MorphingDialogImage({ className, alt, ...props }: MorphingDialogImageProps) {
  const layoutId = useLayoutId("image");
  return (
    <motion.img layoutId={layoutId} alt={alt} draggable={false} className={cn("block w-full object-cover", className)} {...props} />
  );
}

export interface MorphingDialogTextProps
  extends Omit<HTMLMotionProps<"div">, "children" | "layoutId"> {
  children: ReactNode;
}

/** The heading shared between the card and the dialog. Names the dialog. */
export function MorphingDialogTitle({ className, children, ...props }: MorphingDialogTextProps) {
  const { titleId } = useMorphingDialog("MorphingDialogTitle");
  const inside = useContext(InsideContentContext);
  const layoutId = useLayoutId("title");
  return (
    // Position-only layout keeps the text from stretching mid-morph.
    <motion.div
      layoutId={layoutId}
      layout="position"
      id={inside ? titleId : undefined}
      className={cn("font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Secondary text shared between the card and the dialog. */
export function MorphingDialogSubtitle({ className, children, ...props }: MorphingDialogTextProps) {
  const layoutId = useLayoutId("subtitle");
  return (
    <motion.div
      layoutId={layoutId}
      layout="position"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Body text that only appears in the open dialog. Describes the dialog. */
export function MorphingDialogDescription({ className, children, ...props }: MorphingDialogTextProps) {
  const { descriptionId } = useMorphingDialog("MorphingDialogDescription");
  return (
    <motion.div
      id={descriptionId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.28, delay: 0.08, ease: EASE_OUT } }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogCloseProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: ReactNode;
  /** Accessible name when the button has no text. */
  label?: string;
}

/** Closes the dialog. Renders an X icon unless children are given. */
export function MorphingDialogClose({
  className,
  children,
  label = "Close",
  onClick,
  ...props
}: MorphingDialogCloseProps) {
  const { setOpen } = useMorphingDialog("MorphingDialogClose");
  return (
    <motion.button
      type="button"
      aria-label={children ? undefined : label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.08 } }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      className={cn(
        "absolute top-3 right-3 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children ?? <X className="size-4" aria-hidden="true" />}
    </motion.button>
  );
}
