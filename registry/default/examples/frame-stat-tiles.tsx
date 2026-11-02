import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/registry/default/ui/frame"

const stats = [
  { label: "Visits", value: "42k" },
  { label: "Conversion", value: "8.2%" },
  { label: "Trials", value: "312" },
]

export default function FrameStatTiles() {
  return (
    <Frame className="w-full max-w-lg">
      <FrameHeader>
        <FrameTitle>Sample traffic overview</FrameTitle>
      </FrameHeader>
      <div className="grid gap-1 sm:grid-cols-3">
        {stats.map((stat) => (
          <FramePanel key={stat.label}>
            <div className="text-lg font-semibold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </FramePanel>
        ))}
      </div>
    </Frame>
  )
}
