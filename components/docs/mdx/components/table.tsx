import React from "react";

import { cn } from "@/lib/utils";

// Tables are ruled, not boxed: no outer frame or header fill, just a line under
// the header and a hairline between rows. Cells align to the edges of the
// reading column so a table reads as part of the prose around it.
export const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div
    aria-label="Scrollable table"
    className="no-scrollbar my-7 w-full overflow-x-auto rounded-[2px] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-2"
    role="region"
    tabIndex={0}
  >
    <table
      className={cn(
        "w-full border-collapse text-sm [&_thead_tr]:border-b [&_thead_tr]:border-[var(--hui-color-border-base-secondary)]",
        className,
      )}
      {...props}
    />
  </div>
);

export const Tr = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr
    className={cn("m-0 border-b-[0.5px] border-[var(--hui-color-border-base-secondary)]", className)}
    {...props}
  />
);

export const Th = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    className={cn(
      "py-2.5 pe-6 text-left text-[13px] font-medium whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)] last:pe-0 [[align=center]]:text-center [[align=right]]:text-right",
      className,
    )}
    {...props}
  />
);

export const Td = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td
    className={cn(
      "py-3 pe-6 text-left align-top leading-6 first:font-medium first:whitespace-nowrap first:text-[var(--hui-color-foreground-base-primary)] last:pe-0 [[align=center]]:text-center [[align=right]]:text-right",
      className,
    )}
    {...props}
  />
);
