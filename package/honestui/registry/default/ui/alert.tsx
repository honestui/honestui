"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full items-start gap-x-2 gap-y-0.5 rounded-[var(--hui-radius-2)] border-[0.5px] px-3.5 py-3 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-primary)] has-data-[slot=alert-action]:grid-cols-[1fr_auto] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-2 has-[>svg]:has-data-[slot=alert-action]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] [&>svg]:h-[1lh] [&>svg]:w-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--hui-color-border-base-secondary)] bg-transparent [&>svg]:text-[var(--hui-color-foreground-base-secondary)]",
        info: "border-[var(--hui-color-border-accent-primary)] bg-[var(--hui-color-background-accent-primary)] [&>svg]:text-[var(--hui-color-foreground-accent-primary)]",
        success:
          "border-[var(--hui-color-border-success-primary)] bg-[var(--hui-color-background-success-primary)] [&>svg]:text-[var(--hui-color-foreground-success-primary-hover)]",
        warning:
          "border-[var(--hui-color-border-attention-primary)] bg-[var(--hui-color-background-attention-primary)] [&>svg]:text-[var(--hui-color-foreground-attention-primary-hover)]",
        error:
          "border-[var(--hui-color-border-danger-primary)] bg-[var(--hui-color-background-danger-primary)] [&>svg]:text-[var(--hui-color-foreground-danger-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium [svg~&]:col-start-2", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "flex flex-col gap-2.5 text-[var(--hui-color-foreground-base-secondary)] [[data-slot=alert]:not([class*=bg-transparent])_&]:text-[var(--hui-color-foreground-base-primary)] [svg~&]:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "flex gap-1 max-sm:col-start-2 max-sm:mt-2 sm:row-start-1 sm:row-end-3 sm:self-center sm:[[data-slot=alert-description]~&]:col-start-2 sm:[[data-slot=alert-title]~&]:col-start-2 sm:[svg~&]:col-start-2 sm:[svg~[data-slot=alert-description]~&]:col-start-3 sm:[svg~[data-slot=alert-title]~&]:col-start-3",
        className
      )}
      {...props}
    />
  )
}

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal(props: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal {...props} />
}

function AlertDialogBackdrop({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-backdrop"
      className={cn(
        "fixed inset-0 z-[var(--hui-z-index-portal)] bg-[var(--hui-color-overlay-black-a5)] [backdrop-filter:var(--hui-blur-lg)] [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 [@media(prefers-reduced-transparency:reduce)]:bg-[var(--hui-color-overlay-black-a9)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogPopup({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPortal>
      <AlertDialogBackdrop />
      <div className="fixed inset-0 z-[var(--hui-z-index-portal)]">
        <div className="flex h-[100dvh] flex-col items-center overflow-hidden pt-6 max-sm:before:flex-1 sm:overflow-y-auto sm:p-4 sm:before:basis-[20vh] sm:after:flex-1">
          <AlertDialogPrimitive.Popup
            data-slot="alert-dialog-popup"
            className={cn(
              "row-start-2 grid w-full min-w-0 origin-top gap-0 border-[length:var(--hui-border-width-surface,1px)] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] p-0 text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-floating)] [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] motion-safe:[transition:scale_var(--hui-duration-normal)_var(--hui-ease-out),opacity_var(--hui-duration-normal)_var(--hui-ease-out),translate_var(--hui-duration-normal)_var(--hui-ease-out)] will-change-transform data-ending-style:opacity-0 data-starting-style:opacity-0 max-sm:max-h-[90dvh] max-sm:overflow-y-auto max-sm:rounded-t-[var(--hui-radius-dialog,var(--hui-radius-2))] max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[env(safe-area-inset-bottom)] max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4 sm:max-w-[400px] sm:-translate-y-[calc(1.25rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:rounded-[var(--hui-radius-dialog,var(--hui-radius-2))] sm:data-ending-style:scale-[0.97] sm:data-starting-style:scale-[0.97]",
              "relative sm:data-nested:data-ending-style:translate-y-8 sm:data-nested:data-starting-style:translate-y-8",
              className
            )}
            {...props}
          />
        </div>
      </div>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex flex-col gap-[var(--hui-space-2)] border-b-0 p-[var(--hui-space-7)] text-start [&:has(+_[data-slot=alert-dialog-body])]:pb-[var(--hui-space-5)]",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-body"
      className={cn(
        "px-[var(--hui-space-7)] pb-[var(--hui-space-5)] first:p-[var(--hui-space-7)]",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t-0 px-[var(--hui-space-7)] pb-[var(--hui-space-7)] max-sm:*:w-full sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("[font-size:var(--hui-font-size-large)] [line-height:var(--hui-line-height-large)] [letter-spacing:var(--hui-letter-spacing-large)] [font-weight:var(--hui-font-weight-medium)]", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("[font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)]", className)}
      {...props}
    />
  )
}

function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
  )
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogPopup as AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
}
