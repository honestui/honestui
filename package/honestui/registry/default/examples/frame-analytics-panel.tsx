import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/registry/default/ui/frame"

export default function FrameAnalyticsPanel() {
  return (
    <Frame className="w-full max-w-sm">
      <FrameHeader><FrameTitle>Traffic overview</FrameTitle></FrameHeader>
      <FramePanel>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><div className="font-semibold">42k</div><div className="text-muted-foreground">Visits</div></div>
          <div><div className="font-semibold">8.2%</div><div className="text-muted-foreground">CVR</div></div>
          <div><div className="font-semibold">312</div><div className="text-muted-foreground">Trials</div></div>
        </div>
      </FramePanel>
    </Frame>
  )
}
