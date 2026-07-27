import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/registry/default/ui/frame"

export default function FrameDevicePreview() {
  return (
    <Frame className="w-64">
      <FrameHeader><FrameTitle>Mobile preview</FrameTitle></FrameHeader>
      <FramePanel>
        <div className="mx-auto h-40 w-24 rounded-2xl border bg-muted p-2">
          <div className="h-full rounded-xl bg-background" />
        </div>
      </FramePanel>
    </Frame>
  )
}
