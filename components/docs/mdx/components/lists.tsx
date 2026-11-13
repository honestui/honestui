import React from "react";

import { cn } from "@/lib/utils";

const listBase =
  "my-5 ps-5 leading-[1.75] marker:text-[var(--hui-color-foreground-base-tertiary)] [&_ol]:my-2 [&_ul]:my-2";

export const Ul = ({ className, ...props }: React.ComponentProps<"ul">) => (
  <ul className={cn(listBase, "list-disc", className)} {...props} />
);

export const Ol = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol className={cn(listBase, "list-decimal marker:tabular-nums", className)} {...props} />
);

export const Li = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("ps-1.5 text-pretty not-first:mt-2", className)} {...props} />
);
