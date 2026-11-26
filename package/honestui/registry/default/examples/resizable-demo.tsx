import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/default/ui/resizable"

const files = ["app/page.tsx", "app/layout.tsx", "components/header.tsx", "lib/format.ts"]

const label =
  "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]"

export default function ResizableDemo() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-72 w-full max-w-2xl rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    >
      <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
        <div className="flex h-full flex-col gap-[var(--hui-space-2)] p-[var(--hui-space-3)]">
          <p className={label}>Files</p>
          <ul className="m-0 flex list-none flex-col gap-[var(--hui-space-1)] p-0">
            {files.map((file) => (
              <li
                key={file}
                className="truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)]"
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize file list" />
      <ResizablePanel defaultSize={45} minSize={25}>
        <div className="flex h-full flex-col gap-[var(--hui-space-2)] p-[var(--hui-space-3)]">
          <p className={label}>Editor</p>
          <pre className="m-0 overflow-hidden text-[var(--hui-color-foreground-base-primary)] [font-family:var(--hui-font-mono,ui-monospace)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-regular)]">
{`export function formatTotal(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}`}
          </pre>
        </div>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize preview" />
      <ResizablePanel defaultSize={33} minSize={20}>
        <div className="flex h-full flex-col gap-[var(--hui-space-2)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-3)]">
          <p className={label}>Preview</p>
          <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] tabular-nums">
            $1,284.50
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
