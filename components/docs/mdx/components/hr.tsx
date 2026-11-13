import React from "react";

export const Hr = ({ ...props }: React.ComponentProps<"hr">) => (
  <hr className="my-10 border-t-[0.5px] border-[var(--hui-color-border-base-secondary)]" {...props} />
);
