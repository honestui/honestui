import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card"
import { Spinner } from "@/registry/default/ui/spinner"

export default function SpinnerCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Deployment logs</CardTitle>
        <CardDescription>Build #1842 on main</CardDescription>
      </CardHeader>
      <CardPanel>
        <div
          aria-busy="true"
          className="flex min-h-32 flex-col items-center justify-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] border-dashed border-[var(--hui-color-border-base-secondary)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
        >
          <Spinner label="Streaming build logs" />
          <span aria-hidden="true">Waiting for the first log line…</span>
        </div>
      </CardPanel>
    </Card>
  )
}
