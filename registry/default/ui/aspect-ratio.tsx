import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

interface AspectRatioProps extends useRender.ComponentProps<"div"> {
  /** Width divided by height, such as `16 / 9`. Defaults to a square. */
  ratio?: number
}

// CSS aspect-ratio sizes the box from its width, so it needs no padding hack
// or absolutely positioned child. Overflow is clipped so media filling the
// box with object-cover keeps the rounded corners a caller adds.
function AspectRatio({
  ratio = 1,
  className,
  style,
  render,
  ...props
}: AspectRatioProps) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1

  const defaultProps = {
    "data-slot": "aspect-ratio",
    className: cn(
      "relative w-full overflow-hidden [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover [&>iframe]:size-full [&>iframe]:border-0",
      className
    ),
    style: { aspectRatio: String(safeRatio), ...style },
  }

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  })
}

export { AspectRatio }
export type { AspectRatioProps }
