"use client"

import * as React from "react"
import { Toast } from "@base-ui/react/toast"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  Info as InfoIcon,
  LoaderCircle as LoaderCircleIcon,
  TriangleAlert as TriangleAlertIcon,
  X as XIcon,
} from "honestui/icons"

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
  const standardOptions = { ...options }

  delete standardOptions.variant
  delete standardOptions.position
  delete standardOptions.state
  delete standardOptions.duration
  delete standardOptions.icon
  delete standardOptions.styles
  delete standardOptions.fill
  delete standardOptions.roundness
  delete standardOptions.autopilot
  delete standardOptions.button

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
          "fixed z-[var(--rs-z-index-toast)] w-[360px] max-w-[calc(100vw-var(--rs-space-10))] outline-none [--gap:var(--rs-space-4)]",
          "data-[position=top-left]:top-[var(--rs-space-7)] data-[position=top-left]:left-[var(--rs-space-7)]",
          "data-[position=top-center]:top-[var(--rs-space-7)] data-[position=top-center]:left-1/2 data-[position=top-center]:-translate-x-1/2",
          "data-[position=top-right]:top-[var(--rs-space-7)] data-[position=top-right]:right-[var(--rs-space-7)]",
          "data-[position=bottom-left]:bottom-[var(--rs-space-7)] data-[position=bottom-left]:left-[var(--rs-space-7)]",
          "data-[position=bottom-center]:bottom-[var(--rs-space-7)] data-[position=bottom-center]:left-1/2 data-[position=bottom-center]:-translate-x-1/2",
          "data-[position=bottom-right]:right-[var(--rs-space-7)] data-[position=bottom-right]:bottom-[var(--rs-space-7)]"
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
                "absolute box-border h-[var(--height)] w-full cursor-default overflow-clip rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] bg-clip-padding p-[var(--rs-space-3)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-lifted)] select-none [--height:var(--toast-frontmost-height,var(--toast-height))] [--peek:var(--rs-space-4)] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [transition:opacity_var(--rs-duration-slow)_var(--rs-ease-out)] z-[calc(var(--rs-z-index-toast)-var(--toast-index))] motion-safe:[transition:transform_var(--rs-duration-slow)_var(--rs-ease-out),opacity_var(--rs-duration-slow)_var(--rs-ease-out),height_var(--rs-duration-fast)_var(--rs-ease-out)] data-swiping:[transition:none]!",
                "data-[position*=right]:right-0 data-[position*=right]:left-auto data-[position*=left]:right-auto data-[position*=left]:left-0 data-[position*=center]:right-0 data-[position*=center]:left-0",
                "data-[position*=bottom]:top-auto data-[position*=bottom]:bottom-0 data-[position*=bottom]:origin-bottom data-[position*=bottom]:[--offset-y:calc(var(--toast-offset-y)*-1+(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] data-[position*=bottom]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]",
                "data-[position*=top]:top-0 data-[position*=top]:bottom-auto data-[position*=top]:origin-top data-[position*=top]:[--offset-y:calc(var(--toast-offset-y)+(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))] data-[position*=top]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]",
                "after:absolute after:left-0 after:w-full after:content-[''] data-[position*=bottom]:after:bottom-full data-[position*=bottom]:after:h-[calc(var(--gap)+1px)] data-[position*=top]:after:top-full data-[position*=top]:after:h-[calc(var(--gap)+1px)]",
                "data-expanded:h-[var(--toast-height)] data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
                "data-starting-style:opacity-0 data-limited:opacity-0 data-ending-style:opacity-0",
                "data-[position*=bottom]:data-starting-style:[transform:translateY(calc(100%+var(--rs-space-7)))] data-[position*=top]:data-starting-style:[transform:translateY(calc(-100%-var(--rs-space-7)))]",
                "data-[position*=bottom]:data-ending-style:not-data-swipe-direction:[transform:translateY(calc(100%+var(--rs-space-7)))] data-[position*=top]:data-ending-style:not-data-swipe-direction:[transform:translateY(calc(-100%-var(--rs-space-7)))]",
                "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
                "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]"
              )}
            >
              <Toast.Content className="flex items-start gap-[var(--rs-space-3)] overflow-hidden [transition:opacity_var(--rs-duration-moderate)_var(--rs-ease-out)] data-behind:pointer-events-none data-behind:opacity-0 data-expanded:pointer-events-auto data-expanded:opacity-100">
                {Icon && (
                  <div
                    className="inline-flex min-h-[var(--rs-space-7)] w-[var(--rs-space-5)] shrink-0 items-center justify-center text-[var(--rs-color-foreground-base-secondary)] in-data-[type=error]:text-[var(--rs-color-foreground-danger-primary)] in-data-[type=info]:text-[var(--rs-color-foreground-accent-primary)] in-data-[type=success]:text-[var(--rs-color-foreground-success-primary)] in-data-[type=warning]:text-[var(--rs-color-foreground-attention-primary)] [&>svg]:size-[var(--rs-space-5)] [&>svg]:shrink-0 in-data-[type=loading]:[&>svg]:animate-spin"
                    data-slot="toast-icon"
                  >
                    <Icon />
                  </div>
                )}

                <div className="min-w-0 flex-1" data-slot="toast-main">
                  <div className="flex min-h-[var(--rs-space-7)] items-center justify-between gap-[var(--rs-space-3)]">
                    <Toast.Title
                      className="m-0 min-w-0 flex-1 text-[var(--rs-color-foreground-base-primary)] [font-size:var(--rs-font-size-regular)]! [font-weight:var(--rs-font-weight-medium)] [letter-spacing:var(--rs-letter-spacing-regular)] [line-height:var(--rs-line-height-regular)]! [text-wrap:wrap]!"
                      data-slot="toast-title"
                    />
                    <div
                      className="flex shrink-0 items-center gap-[var(--rs-space-1)]"
                      data-slot="toast-actions"
                    >
                      {toast.actionProps && (
                        <Toast.Action
                          className={buttonVariants({
                            variant: "secondary",
                            size: "xs",
                          })}
                          data-slot="toast-action"
                        >
                          {toast.actionProps.children}
                        </Toast.Action>
                      )}
                      <Toast.Close
                        aria-label="Dismiss notification"
                        className={buttonVariants({
                          variant: "link",
                          size: "icon-sm",
                        })}
                        data-slot="toast-close"
                      >
                        <XIcon />
                      </Toast.Close>
                    </div>
                  </div>
                  <Toast.Description
                    className="m-0 text-[var(--rs-color-foreground-base-primary)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)]"
                    data-slot="toast-description"
                  />
                </div>
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export { ToastProvider, type ToastPosition, type ToastVariant, toastManager }
