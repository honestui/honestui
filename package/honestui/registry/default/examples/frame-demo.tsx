import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/registry/default/ui/frame"

export default function FrameDemo() {
  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>
          Brief description about the section
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h2 className="text-sm font-semibold">Section title</h2>
        <p className="text-sm text-muted-foreground">
          Section description
        </p>
      </FramePanel>
    </Frame>
  )
}
