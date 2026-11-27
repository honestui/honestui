"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import {
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type AnimatedTabsVariant = "pill" | "underline";

type ListContextValue = {
  indicatorId: string;
  variant: AnimatedTabsVariant;
  indicatorClassName?: string;
  transition: Transition;
};

const ListContext = createContext<ListContextValue | null>(null);

export type AnimatedTabsProps = TabsPrimitive.Root.Props;

/**
 * Tabs root. Selection, keyboard navigation, and ARIA come from Base UI Tabs.
 * Pass `defaultValue` (or `value`) matching one of the tab values.
 */
export function AnimatedTabs({ className, ...props }: AnimatedTabsProps) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-3", className)} {...props} />;
}

export interface AnimatedTabsListProps extends TabsPrimitive.List.Props {
  /** `pill` slides a raised background; `underline` slides a line under the label. */
  variant?: AnimatedTabsVariant;
  /** Classes for the moving indicator. */
  indicatorClassName?: string;
  /** Spring or tween for the indicator. Defaults to the layout spring. */
  transition?: Transition;
}

export function AnimatedTabsList({
  variant = "pill",
  indicatorClassName,
  transition = SPRING_LAYOUT,
  className,
  children,
  ...props
}: AnimatedTabsListProps) {
  const indicatorId = `animated-tabs-${useId().replace(/:/g, "")}`;

  return (
    <ListContext.Provider value={{ indicatorId, variant, indicatorClassName, transition }}>
      {/* The group scopes the indicator's layoutId to this list. */}
      <LayoutGroup id={indicatorId}>
        <TabsPrimitive.List
          className={cn(
            "relative flex w-fit items-center",
            variant === "pill" && "gap-1 rounded-lg bg-muted p-1",
            variant === "underline" && "gap-5 border-b border-border",
            className,
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.List>
      </LayoutGroup>
    </ListContext.Provider>
  );
}

export type AnimatedTabsTabProps = Omit<TabsPrimitive.Tab.Props, "render">;

export function AnimatedTabsTab({ className, children, ...props }: AnimatedTabsTabProps) {
  const list = useContext(ListContext);
  if (!list) throw new Error("AnimatedTabsTab must be used within <AnimatedTabsList>.");
  const reduce = useReducedMotion();
  const { variant, indicatorClassName, transition } = list;

  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "pill" && "h-8 rounded-md px-3 focus-visible:ring-offset-0",
        variant === "underline" && "h-9 px-0.5 focus-visible:rounded-sm",
        className,
      )}
      // Base UI reports the active state to the render function, so the
      // indicator follows its selection, including keyboard changes.
      render={(tabProps, state) => (
        <button {...tabProps}>
          {state.active ? (
            <motion.span
              layoutId="indicator"
              aria-hidden="true"
              transition={reduce ? { duration: 0.15, ease: EASE_OUT } : transition}
              className={cn(
                "pointer-events-none absolute",
                variant === "pill" &&
                  "inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60 dark:bg-foreground/10 dark:ring-0",
                variant === "underline" && "inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground",
                indicatorClassName,
              )}
            />
          ) : null}
          <span className="relative z-10 inline-flex items-center gap-1.5">{tabProps.children}</span>
        </button>
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Tab>
  );
}

export interface AnimatedTabsPanelProps extends TabsPrimitive.Panel.Props {
  children?: ReactNode;
}

/** A tab panel whose content fades in when it becomes active. */
export function AnimatedTabsPanel({ className, children, ...props }: AnimatedTabsPanelProps) {
  const reduce = useReducedMotion();
  return (
    <TabsPrimitive.Panel
      className={cn("rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Panel>
  );
}
