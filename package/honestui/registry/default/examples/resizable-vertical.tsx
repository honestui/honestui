import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/default/ui/resizable"

const logs = [
  "12:04:11  GET /api/orders 200 38ms",
  "12:04:12  POST /api/checkout 201 112ms",
  "12:04:15  GET /api/orders/481 200 21ms",
  "12:04:19  POST /api/refunds 422 17ms",
]

export default function ResizableVertical() {
  return (
    <ResizablePanelGroup
      orientation="vertical"
      className="h-80 w-full max-w-md rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    >
      <ResizablePanel defaultSize={60} minSize={30}>
        <div className="flex h-full items-center justify-center p-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)]">
          Request details
        </div>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize log panel" />
      <ResizablePanel defaultSize={40} minSize={20}>
        <ul className="m-0 flex h-full list-none flex-col gap-[var(--hui-space-1)] overflow-auto bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-3)] [font-family:var(--hui-font-mono,ui-monospace)] [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-primary)]">
          {logs.map((line) => (
            <li key={line} className="whitespace-nowrap">
              {line}
            </li>
          ))}
        </ul>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
