import React from "react";

import { cn } from "@/lib/utils";

export const Blockquote = ({ className, ...props }: React.ComponentProps<"blockquote">) => (
  <blockquote
    className={cn(
      "my-6 border-s-2 border-[var(--hui-color-border-base-secondary)] ps-4 text-[var(--hui-color-foreground-base-secondary)]",
      className,
    )}
    {...props}
  />
);
