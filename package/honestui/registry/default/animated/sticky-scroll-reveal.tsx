"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface StickyScrollSection {
  /** Stable key. The index is used when omitted. */
  id?: string;
  title: ReactNode;
  body: ReactNode;
  /** What the pinned panel shows while this section is active. */
  visual: ReactNode;
  /** Describes the visual when it carries information. Without it the visual is decorative. */
  visualLabel?: string;
}

export interface StickyScrollRevealProps {
  sections: readonly StickyScrollSection[];
  /**
   * The element that scrolls, when it is not the page, such as a fixed-height box
   * with `overflow-y: auto`. The page is used by default.
   */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Which side the pinned visual sits on. Default "right". */
  side?: "left" | "right";
  /** Distance from the top of the scroll area where the visual pins. Default "1.5rem". */
  stickyTop?: number | string;
  /** Heading element for each section title, to fit the page outline. Default "h3". */
  headingAs?: "h2" | "h3" | "h4";
  /** Show a rail beside each section that lights up while it is active. Default true. */
  rail?: boolean;
  /** Called with the index of the section that becomes active. */
  onActiveChange?: (index: number) => void;
  className?: string;
  /** Class for each section's text block. */
  sectionClassName?: string;
  /** Class for the pinned visual panel. */
  visualClassName?: string;
}

/**
 * The active section is the one under the middle of the scroll area. Near the end
 * of the scroll range the last section wins, so it can activate even when it is short.
 */
function findActive(
  nodes: (HTMLElement | null)[],
  container: HTMLElement | null,
): number {
  const view = container
    ? container.getBoundingClientRect()
    : { top: 0, height: window.innerHeight };
  const middle = view.top + view.height / 2;
  const atEnd = container
    ? container.scrollTop + container.clientHeight >= container.scrollHeight - 2
    : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

  let best = 0;
  let bestDistance = Infinity;
  nodes.forEach((node, i) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const distance = middle < rect.top ? rect.top - middle : middle > rect.bottom ? middle - rect.bottom : 0;
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  if (atEnd) {
    // Only jump to the last section when it is actually on screen.
    const last = nodes[nodes.length - 1];
    if (last && last.getBoundingClientRect().top < view.top + view.height) return nodes.length - 1;
  }
  return best;
}

export function StickyScrollReveal({
  sections,
  scrollContainer,
  side = "right",
  stickyTop = "1.5rem",
  rail = true,
  headingAs: Heading = "h3",
  onActiveChange,
  className,
  sectionClassName,
  visualClassName,
}: StickyScrollRevealProps) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const container = scrollContainer?.current ?? null;
    const target: HTMLElement | Window = container ?? window;
    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const next = findActive(sectionRefs.current, container);
      if (next !== current) {
        current = next;
        setActive(next);
        onActiveChangeRef.current?.(next);
      }
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [scrollContainer, sections.length]);

  const fade = reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT };

  const visualProps = (section: StickyScrollSection) =>
    section.visualLabel
      ? ({ role: "img", "aria-label": section.visualLabel } as const)
      : ({ "aria-hidden": true } as const);

  return (
    <div className={cn("@container w-full", className)}>
      <div
        className={cn(
          "grid grid-cols-1 gap-x-8 @lg:grid-cols-2 @3xl:gap-x-12",
          side === "left" && "@lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="flex flex-col">
          {sections.map((section, i) => {
            const isActive = i === active;
            return (
              <section
                key={section.id ?? i}
                ref={(node) => {
                  sectionRefs.current[i] = node;
                }}
                aria-current={isActive ? "step" : undefined}
                className={cn("relative py-10 @lg:py-20", rail && "ps-6", sectionClassName)}
              >
                {rail ? (
                  <span aria-hidden="true" className="absolute inset-y-10 start-0 w-px bg-border @lg:inset-y-20">
                    <motion.span
                      className="absolute inset-x-0 top-0 h-full origin-top bg-foreground"
                      initial={false}
                      animate={{ scaleY: isActive ? 1 : 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT }}
                    />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "transition-opacity duration-500 ease-out motion-reduce:transition-none",
                    !isActive && "@lg:opacity-40",
                  )}
                >
                  <Heading className="text-lg font-semibold tracking-tight text-foreground">{section.title}</Heading>
                  <div className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{section.body}</div>
                </div>
                {/* On narrow layouts each section shows its own visual inline instead of the pinned panel. */}
                <div
                  className={cn(
                    "mt-6 overflow-hidden rounded-2xl border border-border bg-muted/40 @lg:hidden",
                    visualClassName,
                  )}
                  {...visualProps(section)}
                >
                  {section.visual}
                </div>
              </section>
            );
          })}
        </div>

        <div className="hidden @lg:block">
          <div className="sticky py-10 @lg:py-20" style={{ top: stickyTop }}>
            <div
              className={cn(
                "relative grid aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/40",
                visualClassName,
              )}
            >
              {sections.map((section, i) => {
                const isActive = i === active;
                return (
                  <motion.div
                    key={section.id ?? i}
                    className="col-start-1 row-start-1 grid size-full"
                    initial={false}
                    animate={
                      reduce
                        ? { opacity: isActive ? 1 : 0 }
                        : {
                            opacity: isActive ? 1 : 0,
                            scale: isActive ? 1 : 0.97,
                            filter: isActive ? "blur(0px)" : "blur(6px)",
                          }
                    }
                    transition={fade}
                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                    inert={!isActive}
                    {...(isActive ? visualProps(section) : { "aria-hidden": true })}
                  >
                    {section.visual}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
