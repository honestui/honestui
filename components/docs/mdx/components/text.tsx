import React from "react";

import { cn } from "@/lib/utils";

export const P = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("leading-[1.75] text-pretty not-first:mt-5", className)} {...props} />
);

export const Description = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-muted-foreground", className)} {...props} />
);

// Body copy is set in the secondary ink, so emphasis is carried by both weight
// and the step up to the primary ink.
export const Strong = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <strong
    className={cn("font-semibold text-[var(--hui-color-foreground-base-primary)]", className)}
    {...props}
  />
);
