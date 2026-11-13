import React from "react";

import { cn } from "@/lib/utils";

function slugify(children: React.ReactNode) {
  return children
    ?.toString()
    .replace(/ /g, "-")
    .replace(/'/g, "")
    .replace(/\?/g, "")
    .toLowerCase();
}

// Section headings link to themselves. The anchor sits inside the heading so
// the heading stays a direct sibling of the prose around it (the spacing rules
// below depend on that), and a "#" appears in the gutter on hover or focus.
function HeadingAnchor({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!id) return <>{children}</>;

  return (
    <a
      href={`#${id}`}
      className="group/heading relative rounded-[2px] text-inherit no-underline outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-2"
    >
      <span
        aria-hidden="true"
        className="absolute top-0 -left-[1.1em] hidden font-normal text-[var(--hui-color-foreground-base-tertiary)] opacity-0 transition-opacity duration-150 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100 lg:block"
      >
        #
      </span>
      {children}
    </a>
  );
}

const headingBase =
  "font-heading scroll-m-10 font-semibold text-[var(--hui-color-foreground-base-primary)] select-none first:mt-0";

export const H1 = ({ className, children, ...props }: React.ComponentProps<"h1">) => (
  <h1
    className={cn(
      "font-heading mt-2 scroll-m-10 text-3xl font-semibold tracking-tight text-[var(--hui-color-foreground-base-primary)] select-none",
      className,
    )}
    {...props}
  >
    {children}
  </h1>
);

export const H2 = ({ className, children, id, ...props }: React.ComponentProps<"h2">) => {
  const headingId = id ?? slugify(children);

  return (
    <h2
      id={headingId}
      data-slot="docs-heading"
      className={cn(
        headingBase,
        "mt-14 text-[1.375rem] leading-8 tracking-[-0.02em] [&+*]:mt-4! [&+.steps]:mt-0! [&+.steps>h3]:mt-4! [&+h3]:mt-6!",
        className,
      )}
      {...props}
    >
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h2>
  );
};

export const H3 = ({ className, children, id, ...props }: React.ComponentProps<"h3">) => (
  <h3
    id={id}
    data-slot="docs-heading"
    className={cn(
      headingBase,
      "mt-10 text-[1.0625rem] leading-7 tracking-[-0.01em] [&+*]:mt-3!",
      className,
    )}
    {...props}
  >
    <HeadingAnchor id={id}>{children}</HeadingAnchor>
  </h3>
);

export const H4 = ({ className, children, ...props }: React.ComponentProps<"h4">) => (
  <h4
    data-slot="docs-heading"
    className={cn(headingBase, "mt-8 text-[15px] leading-6 [&+*]:mt-2!", className)}
    {...props}
  >
    {children}
  </h4>
);

export const H5 = ({ className, children, ...props }: React.ComponentProps<"h5">) => (
  <h5 className={cn(headingBase, "mt-8 text-sm leading-6 [&+*]:mt-2!", className)} {...props}>
    {children}
  </h5>
);

export const H6 = ({ className, children, ...props }: React.ComponentProps<"h6">) => (
  <h6
    className={cn(
      headingBase,
      "mt-8 text-[13px] leading-6 font-medium text-[var(--hui-color-foreground-base-secondary)] [&+*]:mt-2!",
      className,
    )}
    {...props}
  >
    {children}
  </h6>
);
