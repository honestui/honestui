"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "honestui/icons";
import { cn } from "@/lib/utils";
import * as React from "react";

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0% 0% -60% 0%" },
    );

    for (const id of itemIds ?? []) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      for (const id of itemIds ?? []) {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      }
    };
  }, [itemIds]);

  return activeId;
}

export function DocsTableOfContents({
  toc,
  variant = "list",
  className,
}: {
  toc: {
    title?: React.ReactNode;
    url: string;
    depth: number;
  }[];
  variant?: "dropdown" | "list";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const itemIds = React.useMemo(() => toc.map((item) => item.url.replace("#", "")), [toc]);
  const activeHeading = useActiveItem(itemIds);
  const activeIndex = activeHeading ? itemIds.indexOf(activeHeading) : -1;

  const handleItemClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>, url: string) => {
      const targetId = decodeURIComponent(url.replace(/^#/, ""));
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      window.history.pushState(null, "", url);
    },
    [],
  );

  if (!toc?.length) {
    return null;
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className={cn("h-8 md:h-7", className)} />}
        >
          On This Page
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="no-scrollbar max-h-[70svh]">
          {toc.map((item) => (
            <DropdownMenuItem
              key={item.url}
              render={<a href={item.url} />}
              onClick={(event) => {
                handleItemClick(event, item.url);
                setOpen(false);
              }}
              data-depth={item.depth}
              className="data-[depth=3]:pl-6 data-[depth=4]:pl-8"
            >
              {item.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TocList
      toc={toc}
      activeIndex={activeIndex}
      onItemClick={handleItemClick}
      className={className}
    />
  );
}

function TocList({
  toc,
  activeIndex,
  onItemClick,
  className,
}: {
  toc: { title?: React.ReactNode; url: string; depth: number }[];
  activeIndex: number;
  onItemClick: (event: React.MouseEvent<HTMLElement>, url: string) => void;
  className?: string;
}) {
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
  } | null>(null);
  const minDepth = React.useMemo(
    () => Math.min(...toc.map((item) => item.depth)),
    [toc],
  );

  React.useLayoutEffect(() => {
    const measure = () => {
      const element = itemRefs.current[activeIndex];
      setIndicator(
        element
          ? { top: element.offsetTop, height: element.offsetHeight }
          : null,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, toc]);

  return (
    <nav
      aria-label="On this page"
      className={cn("flex flex-col select-none", className)}
    >
      <p className="text-muted-foreground mb-2.5 text-xs">On this page</p>
      <ol className="relative flex flex-col">
        <span
          aria-hidden="true"
          className="bg-border/60 absolute inset-y-0 left-0 w-px"
        />
        <span
          aria-hidden="true"
          className={cn(
            "bg-foreground absolute left-0 w-px rounded-full motion-safe:transition-[transform,height,opacity] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
            indicator ? "opacity-100" : "opacity-0",
          )}
          style={{
            height: indicator?.height ?? 0,
            transform: `translateY(${indicator?.top ?? 0}px)`,
          }}
        />
        {toc.map((item, index) => {
          const isActive = index === activeIndex;
          const level = Math.min(item.depth - minDepth, 2);

          return (
            <li key={item.url} className="flex">
              <a
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                href={item.url}
                onClick={(event) => onItemClick(event, item.url)}
                aria-current={isActive ? "location" : undefined}
                data-active={isActive}
                data-level={level}
                className="text-muted-foreground/80 hover:text-foreground data-[active=true]:text-foreground py-[5px] pr-2 pl-3.5 text-[13px] leading-[18px] text-pretty no-underline transition-colors duration-150 empty:hidden data-[level=1]:pl-6 data-[level=1]:text-[12.5px] data-[level=2]:pl-8.5 data-[level=2]:text-[12.5px]"
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => {
          const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth";
          // On wide screens the docs content scrolls inside its own panel.
          document
            .getElementById("docs-main-content")
            ?.scrollIntoView({ behavior, block: "start" });
          window.scrollTo({ top: 0, behavior });
        }}
        className={cn(
          "text-muted-foreground/70 hover:text-foreground mt-5 inline-flex w-fit cursor-pointer items-center gap-1 rounded-sm text-xs outline-none transition-[color,opacity] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50",
          activeIndex > 0 ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        tabIndex={activeIndex > 0 ? 0 : -1}
      >
        Back to top
        <ArrowUp aria-hidden="true" className="size-3" />
      </button>
    </nav>
  );
}
