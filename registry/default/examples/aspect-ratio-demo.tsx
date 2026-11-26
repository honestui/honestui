import { AspectRatio } from "@/registry/default/ui/aspect-ratio"

export default function AspectRatioDemo() {
  return (
    <figure className="m-0 w-full max-w-md">
      <AspectRatio
        ratio={16 / 9}
        className="rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-base-secondary)]"
      >
        <img
          src="https://picsum.photos/1280/720?grayscale&random=31"
          alt="Grayscale landscape with hills under an overcast sky"
          width={1280}
          height={720}
        />
      </AspectRatio>
      <figcaption className="mt-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
        The 16:9 box reserves its height before the image loads.
      </figcaption>
    </figure>
  )
}
