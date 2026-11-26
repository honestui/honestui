import { AspectRatio } from "@/registry/default/ui/aspect-ratio"

const ratios = [
  { label: "1:1", value: 1, use: "Avatars, product tiles" },
  { label: "4:3", value: 4 / 3, use: "Screenshots, slides" },
  { label: "16:9", value: 16 / 9, use: "Video, hero images" },
  { label: "21:9", value: 21 / 9, use: "Banners, cinematic" },
]

export default function AspectRatioRatios() {
  return (
    <div className="grid w-full max-w-xl grid-cols-2 items-end gap-[var(--hui-space-4)] sm:grid-cols-4">
      {ratios.map((ratio) => (
        <div key={ratio.label} className="flex flex-col gap-[var(--hui-space-2)]">
          <AspectRatio
            ratio={ratio.value}
            className="flex items-center justify-center rounded-[var(--hui-radius-2)] border-[0.5px] border-dashed border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-secondary)]"
          >
            <span className="tabular-nums text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)]">
              {ratio.label}
            </span>
          </AspectRatio>
          <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
            {ratio.use}
          </span>
        </div>
      ))}
    </div>
  )
}
