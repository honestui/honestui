import { TrendingUp } from "honestui/icons";

import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { quickInsight } from "@/lib/dashboard/data";
import { formatCurrency } from "@/lib/dashboard/format";

export function QuickInsight() {
  return (
    <section aria-label="Insight" className="flex min-w-0">
      <Card variant="soft" className="w-full gap-2.5 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp
              aria-hidden
              className="size-4 shrink-0 text-[var(--hui-color-foreground-success-primary)]"
            />
            {quickInsight.headline}
          </CardTitle>
        </CardHeader>
        <CardPanel className="flex flex-1 flex-col px-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {quickInsight.detail}
          </p>
          <Separator variant="secondary" className="mt-4 mb-1" />
          <ul className="flex flex-1 flex-col justify-evenly text-sm">
            {quickInsight.breakdown.map((item) => (
              <li
                key={item.label}
                className="flex items-baseline justify-between gap-4 py-1.5"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(item.mrr)}
                </span>
              </li>
            ))}
          </ul>
        </CardPanel>
      </Card>
    </section>
  );
}
