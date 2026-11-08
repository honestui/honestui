"use client";

import * as React from "react";
import type { Components } from "react-markdown";

import { Checkbox } from "../../components/ui/checkbox.js";
import { cn } from "../../lib/utils.js";

/**
 * Markdown task lists in a chat reply are checklists for the reader, so here
 * they can be ticked: the box is a real checkbox, clicking the task's text
 * toggles it, and a done task is struck through. Ticks live in this view
 * only; nothing is sent to the assistant or saved.
 *
 * The box keeps Markdown's `markdown-task-mark` slot, so the prose styles
 * still place it where the bullet would be.
 */
function TaskCheckbox({ checked }: React.ComponentProps<"input">) {
  const [done, setDone] = React.useState(Boolean(checked));
  const [name, setName] = React.useState("");
  const mark = React.useRef<HTMLSpanElement>(null);
  // The task's own words name the box, read once the item has rendered.
  React.useLayoutEffect(() => {
    const item = mark.current?.closest("li");
    if (!item) return;
    item.toggleAttribute("data-done", done);
    setName(item.textContent?.trim() ?? "");
  }, [done]);
  return (
    <span ref={mark} data-slot="markdown-task-mark" className="inline-flex">
      <Checkbox
        size="small"
        checked={done}
        onCheckedChange={setDone}
        aria-label={name || undefined}
        className="size-[1.05em] min-h-0 min-w-0"
      />
    </span>
  );
}

function TaskItem({ className, children, ...rest }: React.ComponentProps<"li"> & { node?: unknown }) {
  // react-markdown passes its syntax node, which is not an attribute.
  const props = { ...rest };
  delete props.node;
  const task = typeof className === "string" && className.includes("task-list-item");
  if (!task)
    return (
      <li className={className} {...props}>
        {children}
      </li>
    );
  return (
    <li
      {...props}
      className={cn(
        className,
        "cursor-pointer transition-colors data-done:text-[var(--hui-color-foreground-base-secondary)] data-done:line-through data-done:decoration-[var(--hui-color-foreground-base-tertiary)]",
      )}
      // The text toggles its box, as a label would; links and other
      // controls inside the item keep their own clicks.
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("a, button, input, [role=checkbox], summary")) return;
        if (window.getSelection()?.toString()) return;
        event.currentTarget.querySelector<HTMLElement>("[data-slot=markdown-task-mark] [role=checkbox]")?.click();
      }}
    >
      {children}
    </li>
  );
}

export const chatMarkdownComponents: Components = {
  input: TaskCheckbox,
  li: TaskItem,
};
