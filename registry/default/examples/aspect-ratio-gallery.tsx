import { AspectRatio } from "@/registry/default/ui/aspect-ratio"

const photos = [
  { id: 12, alt: "Grayscale coastline with rocks" },
  { id: 24, alt: "Grayscale city street at dusk" },
  { id: 37, alt: "Grayscale forest path" },
  { id: 48, alt: "Grayscale mountain ridge" },
  { id: 53, alt: "Grayscale desk with a notebook" },
  { id: 66, alt: "Grayscale bridge over a river" },
]

export default function AspectRatioGallery() {
  return (
    <ul className="m-0 grid w-full max-w-md list-none grid-cols-3 gap-[var(--hui-space-2)] p-0">
      {photos.map((photo) => (
        <li key={photo.id}>
          {/* Mixed source sizes crop to the same square, so rows stay even. */}
          <AspectRatio className="rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)]">
            <img
              src={`https://picsum.photos/400/${photo.id % 2 ? 600 : 300}?grayscale&random=${photo.id}`}
              alt={photo.alt}
              loading="lazy"
            />
          </AspectRatio>
        </li>
      ))}
    </ul>
  )
}
