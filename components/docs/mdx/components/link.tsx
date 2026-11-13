import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

// One link treatment for prose, tables and external links: the text takes the
// primary ink so it stands out from body copy, and a hairline underline in a
// muted tone keeps it recognisable as a link without colour alone. The
// underline darkens on hover.
export const docsLinkClassName =
  "rounded-[2px] font-medium text-[var(--hui-color-foreground-base-primary)] underline decoration-[var(--hui-color-foreground-base-tertiary)] decoration-1 underline-offset-[3.5px] outline-none transition-[text-decoration-color] duration-150 hover:decoration-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-2";

export const A = ({ className, ...props }: React.ComponentProps<"a">) => (
  <a className={cn(docsLinkClassName, className)} {...props} />
);

export const MDXLink = ({
  children,
  className,
  href,
  _blank,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  _blank?: boolean;
}) => {
  return (
    <Link
      href={href}
      target={_blank ? "_blank" : undefined}
      rel={_blank ? "noreferrer" : undefined}
      className={cn(docsLinkClassName, className)}
    >
      {children}
      {_blank ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </Link>
  );
};
