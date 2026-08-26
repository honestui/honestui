import * as React from "react";

import { cn } from "@/lib/utils";

function Anatomy({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      data-slot="component-anatomy"
      className={cn(
        "my-6 overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)]",
        className,
      )}
    >
      <figcaption className="border-b-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-neutral-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
        <span className="font-mono text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]">
          {title}
        </span>
      </figcaption>
      <ul className="grid gap-[var(--hui-space-2)] p-[var(--hui-space-4)] sm:p-[var(--hui-space-5)]">
        {children}
      </ul>
    </figure>
  );
}

function AnatomyItem({
  name,
  description,
  children,
  className,
}: {
  name: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("relative list-none", className)}>
      <div className="grid gap-[var(--hui-space-1)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-3)] sm:grid-cols-[minmax(7rem,auto)_1fr] sm:items-baseline sm:gap-[var(--hui-space-4)]">
        <span className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]">
          {name}
        </span>
        {description && (
          <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
            {description}
          </span>
        )}
      </div>
      {children && (
        <ul className="relative ms-[var(--hui-space-4)] mt-[var(--hui-space-2)] grid gap-[var(--hui-space-2)] border-s border-[var(--hui-color-border-base-secondary)] ps-[var(--hui-space-4)] before:absolute before:-start-px before:top-0 before:h-[var(--hui-space-5)] before:w-[var(--hui-space-4)] before:rounded-es-[var(--hui-radius-2)] before:border-b before:border-s before:border-[var(--hui-color-border-base-secondary)] [&>li]:before:absolute [&>li]:before:-start-[var(--hui-space-4)] [&>li]:before:top-[var(--hui-space-5)] [&>li]:before:w-[var(--hui-space-4)] [&>li]:before:border-t [&>li]:before:border-[var(--hui-color-border-base-secondary)]">
          {children}
        </ul>
      )}
    </li>
  );
}

export { Anatomy, AnatomyItem };
