import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/default/ui/resizable"

const pane =
  "flex h-full items-center justify-center p-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)]"

export default function ResizableWithHandle() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-56 w-full max-w-md rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    >
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className={pane}>Original</div>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize comparison" />
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className={pane}>Revised</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
