import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/default/ui/carousel"

const releases = [
  {
    version: "v2.4",
    title: "Density tokens",
    description: "Compact, default, and comfortable spacing from one attribute.",
    detail: "Tables, menus, and forms read the same density so a dense screen stays consistent.",
  },
  {
    version: "v2.3",
    title: "Paste table",
    description: "Paste rows from a spreadsheet and review them before import.",
    detail: "Every cell is validated in place, with the failing rows kept for correction.",
  },
  {
    version: "v2.2",
    title: "Change review",
    description: "Show what an edit changes before anyone confirms it.",
    detail: "Field-level diffs with an audit trail of who approved each change.",
  },
  {
    version: "v2.1",
    title: "Async action",
    description: "Buttons that report pending, success, failure, and undo.",
    detail: "The label tells people what happened instead of a spinner that never explains.",
  },
]

export default function CarouselDemo() {
  return (
    <Carousel aria-label="Recent releases" className="w-full max-w-sm">
      <CarouselContent>
        {releases.map((release) => (
          <CarouselItem key={release.version}>
            <Card className="h-full">
              <CardHeader>
                <p className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums">
                  {release.version}
                </p>
                <CardTitle>{release.title}</CardTitle>
                <CardDescription>{release.description}</CardDescription>
              </CardHeader>
              <CardPanel className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)]">
                {release.detail}
              </CardPanel>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-[var(--hui-space-4)] flex justify-end gap-[var(--hui-space-2)]">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  )
}
