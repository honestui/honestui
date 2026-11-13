import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { AlertIcon, CheckboxCheckedIcon, InfoIcon, WarningIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";

// Callouts are one flat panel: a hairline border, a quiet fill, and the variant
// carried only by the icon and title colour. The body reads as normal prose.
const alertVariants = cva(
  "relative my-6 flex w-full flex-col gap-1.5 rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-secondary)] px-4 py-3.5 text-sm [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "[--alert-tone:var(--hui-color-foreground-base-primary)]",
        warning: "[--alert-tone:var(--color-amber-600)] dark:[--alert-tone:var(--color-amber-400)]",
        info: "[--alert-tone:var(--color-blue-600)] dark:[--alert-tone:var(--color-blue-400)]",
        error: "[--alert-tone:var(--hui-color-foreground-danger-primary)]",
        success: "[--alert-tone:var(--hui-color-foreground-success-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const descriptionVariants = cva(
  "flex w-full flex-col gap-2 text-sm leading-6 text-[var(--hui-color-foreground-base-secondary)] [&_p]:mt-0 [&_p]:leading-6 [&_ul]:my-0 [&_ul]:ps-4",
  {
    variants: {
      variant: {
        default: "",
        warning: "",
        info: "",
        error: "",
        success: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  children,
  title,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    title?: string;
  }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-center gap-2 text-[var(--alert-tone)] select-none">
        <span aria-hidden="true">{getAlertIcon(variant)}</span>
        <span className="text-[13px] font-semibold">{title ? title : getAlertTitle(variant)}</span>
      </div>
      {children}
    </div>
  );
}

function AlertContent({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof descriptionVariants>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(descriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

function getAlertIcon(variant: VariantProps<typeof alertVariants>["variant"]) {
  switch (variant) {
    case "default":
      return <AlertIcon />;
    case "warning":
      return <WarningIcon />;
    case "info":
      return <InfoIcon />;
    case "error":
      return <WarningIcon />;
    case "success":
      return <CheckboxCheckedIcon />;
    default:
      return <AlertIcon />;
  }
}

function getAlertTitle(variant: VariantProps<typeof alertVariants>["variant"]) {
  switch (variant) {
    case "default":
      return "Note";
    case "warning":
      return "Warning";
    case "info":
      return "Note";
    case "error":
      return "Error";
    case "success":
      return "Success";
    default:
      return "Note";
  }
}

export { Alert, AlertContent };
