import { TrendingUp as TrendingUpIcon } from "love-ui/icons"

import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardMetricSummary() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardPanel>
        <div className="flex items-end justify-between gap-6">
          <div className="text-3xl font-semibold tracking-tight">$48.2k</div>
          <div className="flex items-center gap-1 text-sm text-success">
            <TrendingUpIcon className="size-4" />
            12.4%
          </div>
        </div>
      </CardPanel>
    </Card>
  )
}
