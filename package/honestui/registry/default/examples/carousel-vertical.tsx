import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/default/ui/carousel"

const updates = [
  { time: "09:12", text: "Deploy 4812 reached production in all regions." },
  { time: "09:40", text: "Error rate on checkout returned to its 7-day baseline." },
  { time: "10:05", text: "Invoices for March finished exporting to the warehouse." },
  { time: "10:31", text: "Two new members accepted their workspace invitations." },
  { time: "11:02", text: "Nightly backup verified with 0 missing objects." },
]

export default function CarouselVertical() {
  return (
    <Carousel
      aria-label="Activity updates"
      orientation="vertical"
      className="flex w-full max-w-sm items-center gap-[var(--hui-space-3)]"
    >
      <CarouselContent className="h-28 flex-1">
        {updates.map((update) => (
          <CarouselItem key={update.time}>
            <div className="flex h-28 flex-col justify-center gap-[var(--hui-space-1)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)]">
              <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums">
                {update.time}
              </span>
              <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)]">
                {update.text}
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex flex-col gap-[var(--hui-space-2)]">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  )
}
