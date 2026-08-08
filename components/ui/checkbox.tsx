"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui-components/react/checkbox"
import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui-components/react/checkbox-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "inline-flex shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[var(--rs-radius-1)] border border-[var(--rs-color-border-base-secondary)] bg-[var(--rs-color-background-base-primary)] outline-none motion-safe:[transition:background-color_var(--rs-duration-fast)_var(--rs-ease-out),border-color_var(--rs-duration-fast)_var(--rs-ease-out),transform_var(--rs-duration-press)_var(--rs-ease-out)] not-data-disabled:hover:border-[var(--rs-color-border-base-focus)] not-data-disabled:hover:bg-[var(--rs-color-background-base-primary-hover)] not-data-disabled:not-data-readonly:active:scale-[var(--rs-scale-pressed-strong)] focus-visible:[outline:var(--rs-focus-ring)] focus-visible:outline-offset-[var(--rs-focus-ring-offset-accent)] data-checked:border-0 data-checked:bg-[var(--rs-color-background-accent-emphasis)] data-checked:hover:bg-[var(--rs-color-background-accent-emphasis-hover)] data-indeterminate:border-0 data-indeterminate:bg-[var(--rs-color-background-neutral-tertiary)] data-indeterminate:hover:bg-[var(--rs-color-background-neutral-secondary)] data-readonly:cursor-default data-readonly:opacity-70 data-invalid:border-[var(--rs-color-border-danger-primary)] data-invalid:data-checked:bg-[var(--rs-color-background-danger-primary)] data-invalid:data-indeterminate:bg-[var(--rs-color-background-danger-primary)] aria-invalid:border-[var(--rs-color-border-danger-primary)] aria-invalid:data-checked:bg-[var(--rs-color-background-danger-primary)] aria-invalid:data-indeterminate:bg-[var(--rs-color-background-danger-primary)] data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:data-checked:border-0 data-disabled:data-checked:bg-[var(--rs-color-background-accent-emphasis)] data-disabled:data-checked:hover:bg-[var(--rs-color-background-accent-emphasis)] data-disabled:data-indeterminate:border-0 data-disabled:data-indeterminate:bg-[var(--rs-color-background-neutral-tertiary)] data-disabled:data-indeterminate:hover:bg-[var(--rs-color-background-neutral-tertiary)]",
  {
    variants: {
      size: {
        large:
          "size-[var(--rs-space-5)] min-h-[var(--rs-space-5)] min-w-[var(--rs-space-5)]",
        small:
          "size-[var(--rs-space-4)] min-h-[var(--rs-space-4)] min-w-[var(--rs-space-4)]",
      },
    },
    defaultVariants: {
      size: "large",
    },
  }
)

type CheckboxProps = CheckboxPrimitive.Root.Props &
  VariantProps<typeof checkboxVariants>

function Checkbox({ className, size, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex size-full items-center justify-center text-[var(--rs-color-foreground-accent-emphasis)] motion-safe:[transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out),transform_var(--rs-duration-fast)_var(--rs-ease-out)] data-ending-style:scale-80 data-ending-style:opacity-0 data-starting-style:scale-80 data-starting-style:opacity-0 data-unchecked:opacity-0 [&_svg]:size-full"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5.252 12h13.496" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
              </svg>
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  )
}

const checkboxGroupVariants = cva(
  "flex flex-col gap-[var(--rs-space-3)]",
  {
    variants: {
      orientation: {
        vertical: "flex-col",
        horizontal: "flex-row flex-wrap",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

type CheckboxGroupProps = Omit<CheckboxGroupPrimitive.Props, "orientation"> &
  VariantProps<typeof checkboxGroupVariants>

function CheckboxGroup({
  className,
  orientation,
  ...props
}: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={cn(checkboxGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

export { Checkbox, CheckboxGroup, checkboxVariants, checkboxGroupVariants }
