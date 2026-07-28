import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/registry/default/ui/frame"

export default function FrameCodeOutput() {
  return (
    <Frame className="w-full max-w-sm">
      <FrameHeader><FrameTitle>Build output</FrameTitle></FrameHeader>
      <FramePanel className="font-mono text-xs text-muted-foreground">Compiled in 824ms</FramePanel>
      <FrameFooter className="text-xs text-muted-foreground">Last run just now</FrameFooter>
    </Frame>
  )
}
