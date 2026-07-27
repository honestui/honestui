"use client"

import * as React from "react"
import { Toast } from "@base-ui-components/react/toast"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  Info as InfoIcon,
  LoaderCircle as LoaderCircleIcon,
  TriangleAlert as TriangleAlertIcon,
} from "love-ui/icons"

import {
  gooey,
  Toaster as GooeyToaster,
  type GooeyOptions,
  type GooeyState,
} from "./toast-gooey"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const standardToastManager = Toast.createToastManager()

const TOAST_ICONS = {
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  error: CircleAlertIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
} as const

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

type ToastVariant = "default" | "standard" | "gooey"
type StandardToastOptions = Parameters<typeof standardToastManager.add>[0]
type StandardToastUpdateOptions = Parameters<typeof standardToastManager.update>[1]

interface ToastOptions extends StandardToastOptions {
  variant?: ToastVariant
  position?: ToastPosition
  state?: GooeyState
  duration?: GooeyOptions["duration"]
  icon?: GooeyOptions["icon"]
  styles?: GooeyOptions["styles"]
  fill?: GooeyOptions["fill"]
  roundness?: GooeyOptions["roundness"]
  autopilot?: GooeyOptions["autopilot"]
  button?: GooeyOptions["button"]
}

interface ToastUpdateOptions extends StandardToastUpdateOptions {
  variant?: ToastVariant
  position?: ToastPosition
  state?: GooeyState
  duration?: GooeyOptions["duration"]
  icon?: GooeyOptions["icon"]
  styles?: GooeyOptions["styles"]
  fill?: GooeyOptions["fill"]
  roundness?: GooeyOptions["roundness"]
  autopilot?: GooeyOptions["autopilot"]
  button?: GooeyOptions["button"]
}

interface ToastPromiseOptions<Value> {
  variant?: ToastVariant
  position?: ToastPosition
  loading: string | ToastOptions
  success: string | ToastOptions | ((result: Value) => string | ToastOptions)
  error: string | ToastOptions | ((error: unknown) => string | ToastOptions)
}

interface ToastProviderProps extends Toast.Provider.Props {
  position?: ToastPosition
  gooeyPosition?: ToastPosition
  gooeyOptions?: Partial<GooeyOptions>
}

function getGooeyState(type?: string, state?: GooeyState): GooeyState {
  if (state) return state
  if (
    type === "success" ||
    type === "loading" ||
    type === "error" ||
    type === "warning" ||
    type === "info" ||
    type === "action"
  ) {
    return type
  }
  return "success"
}

function getGooeyButton(options: ToastOptions | ToastUpdateOptions) {
  if (options.button) return options.button

  const children = options.actionProps?.children
  const onClick = options.actionProps?.onClick
  if (typeof children !== "string" || !onClick) return undefined

  return {
    title: children,
    onClick: () => onClick({} as React.MouseEvent<HTMLButtonElement>),
  }
}

function toGooeyOptions(options: ToastOptions | ToastUpdateOptions): GooeyOptions {
  return {
    title: typeof options.title === "string" ? options.title : undefined,
    description: options.description,
    position: options.position,
    duration:
      options.duration ??
      (options.timeout === 0 ? null : options.timeout),
    icon: options.icon,
    styles: options.styles,
    fill: options.fill,
    roundness: options.roundness,
    autopilot: options.autopilot,
    button: getGooeyButton(options),
  }
}

function addGooeyToast(options: ToastOptions) {
  const state = getGooeyState(options.type, options.state)
  const config = toGooeyOptions(options)

  if (state === "loading") {
    return (gooey.show as (opts: GooeyOptions & { state: GooeyState }) => string)(
      { ...config, state }
    )
  }
  return gooey[state](config)
}

function toStandardOptions(options: ToastOptions | ToastUpdateOptions) {
  const {
    variant,
    position,
    state,
    duration,
    icon,
    styles,
    fill,
    roundness,
    autopilot,
    button,
    ...standardOptions
  } = options

  return standardOptions
}

function resolvePromiseOption<Value>(
  option: ToastPromiseOptions<Value>["success"],
  value: Value
) {
  return typeof option === "function" ? option(value) : option
}

function normalizePromiseOption(option: string | ToastOptions) {
  return typeof option === "string" ? { title: option } : option
}

const toastManager = {
  add(options: ToastOptions) {
    if (options.variant === "gooey") return addGooeyToast(options)
    return standardToastManager.add(toStandardOptions(options))
  },
  close(id: string) {
    standardToastManager.close(id)
    gooey.dismiss(id)
  },
  update(id: string, options: ToastUpdateOptions) {
    if (options.variant === "gooey") {
      gooey.dismiss(id)
      addGooeyToast(options as ToastOptions)
      return
    }

    standardToastManager.update(id, toStandardOptions(options))
  },
  promise<Value>(
    promiseValue: Promise<Value>,
    options: ToastPromiseOptions<Value>
  ) {
    if (options.variant === "gooey") {
      return gooey.promise(promiseValue, {
        position: options.position,
        loading: toGooeyOptions(normalizePromiseOption(options.loading)),
        success: (result: Value) =>
          toGooeyOptions(
            normalizePromiseOption(resolvePromiseOption(options.success, result))
          ),
        error: (error: unknown) =>
          toGooeyOptions(
            normalizePromiseOption(resolvePromiseOption(options.error, error))
          ),
      })
    }

    return standardToastManager.promise(promiseValue, {
      loading: toStandardOptions(normalizePromiseOption(options.loading)),
      success: (result: Value) =>
        toStandardOptions(
          normalizePromiseOption(resolvePromiseOption(options.success, result))
        ),
      error: (error: unknown) =>
        toStandardOptions(
          normalizePromiseOption(resolvePromiseOption(options.error, error))
        ),
    })
  },
}

function ToastProvider({
  children,
  position = "bottom-right",
  gooeyPosition = "top-right",
  gooeyOptions,
  ...props
}: ToastProviderProps) {
  return (
    <Toast.Provider toastManager={standardToastManager} {...props}>
      {children}
      <ToastList position={position} />
      <GooeyToaster position={gooeyPosition} options={gooeyOptions} />
    </Toast.Provider>
  )
}

function ToastList({ position = "bottom-right" }: { position: ToastPosition }) {
  const { toasts } = Toast.useToastManager()
  const isTop = position.startsWith("top")

  return (
    <Toast.Portal data-slot="toast-portal">
      <Toast.Viewport
        className={cn(
          "fixed z-50 mx-auto flex w-[calc(100%-var(--toast-inset)*2)] max-w-90 [--toast-inset:--spacing(4)] sm:[--toast-inset:--spacing(8)]",
          // Vertical positioning
          "data-[position*=top]:top-(--toast-inset)",
          "data-[position*=bottom]:bottom-(--toast-inset)",
          // Horizontal positioning
          "data-[position*=left]:left-(--toast-inset)",
          "data-[position*=right]:right-(--toast-inset)",
          "data-[position*=center]:left-1/2 data-[position*=center]:-translate-x-1/2"
        )}
        data-slot="toast-viewport"
        data-position={position}
      >
        {toasts.map((toast) => {
          const Icon = toast.type
            ? TOAST_ICONS[toast.type as keyof typeof TOAST_ICONS]
            : null

          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              data-position={position}
              swipeDirection={
                position.includes("center")
                  ? [isTop ? "up" : "down"]
                  : position.includes("left")
                    ? ["left", isTop ? "up" : "down"]
                    : ["right", isTop ? "up" : "down"]
              }
              className={cn(
                "absolute z-[calc(9999-var(--toast-index))] h-(--toast-calc-height) w-full rounded-lg border bg-popover bg-clip-padding px-3.5 py-3 text-popover-foreground shadow-lg select-none [transition:transform_.5s_cubic-bezier(.22,1,.36,1),opacity_.5s,height_.15s] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
                // Base positioning using data-position
                "data-[position*=right]:right-0 data-[position*=right]:left-auto",
                "data-[position*=left]:right-auto data-[position*=left]:left-0",
                "data-[position*=center]:right-0 data-[position*=center]:left-0",
                "data-[position*=top]:top-0 data-[position*=top]:bottom-auto data-[position*=top]:origin-top",
                "data-[position*=bottom]:top-auto data-[position*=bottom]:bottom-0 data-[position*=bottom]:origin-bottom",
                // Gap fill for hover
                "after:absolute after:left-0 after:h-[calc(var(--toast-gap)+1px)] after:w-full",
                "data-[position*=top]:after:top-full",
                "data-[position*=bottom]:after:bottom-full",
                // Define some variables
                "[--toast-calc-height:var(--toast-frontmost-height,var(--toast-height))] [--toast-gap:--spacing(3)] [--toast-peek:--spacing(3)] [--toast-scale:calc(max(0,1-(var(--toast-index)*.1)))] [--toast-shrink:calc(1-var(--toast-scale))]",
                // Define offset-y variable
                "data-[position*=top]:[--toast-calc-offset-y:calc(var(--toast-offset-y)+var(--toast-index)*var(--toast-gap)+var(--toast-swipe-movement-y))]",
                "data-[position*=bottom]:[--toast-calc-offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--toast-gap)*-1+var(--toast-swipe-movement-y))]",
                // Default state transform
                "data-[position*=top]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--toast-peek))+(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                "data-[position*=bottom]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--toast-peek))-(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                // Limited state
                "data-limited:opacity-0",
                // Expanded state
                "data-expanded:h-(--toast-height)",
                "data-[position]:data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-calc-offset-y))]",
                // Starting and ending animations
                "data-[position*=top]:data-starting-style:[transform:translateY(calc(-100%-var(--toast-inset)))]",
                "data-[position*=bottom]:data-starting-style:[transform:translateY(calc(100%+var(--toast-inset)))]",
                "data-ending-style:opacity-0",
                // Ending animations (direction-aware)
                "data-ending-style:not-data-limited:not-data-swipe-direction:[transform:translateY(calc(100%+var(--toast-inset)))]",
                "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]",
                // Ending animations (expanded)
                "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]"
              )}
            >
              <Toast.Content className="flex items-center justify-between gap-1.5 overflow-hidden text-sm transition-opacity duration-250 data-behind:pointer-events-none data-behind:opacity-0 data-expanded:pointer-events-auto data-expanded:opacity-100">
                <div className="flex gap-2">
                  {Icon && (
                    <div
                      className="mt-.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>svg]:h-[1lh] [&>svg]:w-4"
                      data-slot="toast-icon"
                    >
                      <Icon className="in-data-[type=error]:text-destructive in-data-[type=info]:text-info in-data-[type=loading]:animate-spin in-data-[type=loading]:opacity-72 in-data-[type=success]:text-success in-data-[type=warning]:text-warning" />
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <Toast.Title
                      className="font-medium"
                      data-slot="toast-title"
                    />
                    <Toast.Description
                      className="text-muted-foreground"
                      data-slot="toast-description"
                    />
                  </div>
                </div>
                {toast.actionProps && (
                  <Toast.Action
                    className={buttonVariants({ size: "xs" })}
                    data-slot="toast-action"
                  >
                    {toast.actionProps.children}
                  </Toast.Action>
                )}
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export { ToastProvider, type ToastPosition, type ToastVariant, toastManager }
