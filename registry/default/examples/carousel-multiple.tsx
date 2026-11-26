import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/default/ui/carousel"

const templates = [
  { name: "Invoice", rows: "12 fields" },
  { name: "Onboarding", rows: "8 steps" },
  { name: "Incident report", rows: "15 fields" },
  { name: "Expense claim", rows: "9 fields" },
  { name: "Access request", rows: "6 fields" },
  { name: "Vendor review", rows: "11 fields" },
  { name: "Release checklist", rows: "14 steps" },
]

export default function CarouselMultiple() {
  return (
    <Carousel aria-label="Form templates" className="w-full max-w-xl">
      <div className="mb-[var(--hui-space-3)] flex items-center justify-between">
        <h3 className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]">
          Templates
        </h3>
        <div className="flex gap-[var(--hui-space-2)]">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
      <CarouselContent>
        {templates.map((template) => (
          <CarouselItem key={template.name} className="basis-1/2 md:basis-1/3">
            <div className="flex aspect-[4/3] flex-col justify-end rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-4)]">
              <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)]">
                {template.name}
              </p>
              <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
                {template.rows}
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
