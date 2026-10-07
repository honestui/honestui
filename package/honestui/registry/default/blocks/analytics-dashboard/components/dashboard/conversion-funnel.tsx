import { funnelStages } from "@/lib/dashboard/data";
import { formatNumber, formatPercent } from "@/lib/dashboard/format";

/**
 * Funnel composed from primitives — HonestUI has no funnel chart, so bars
 * share one scale (percent of visitors) and each stage shows its conversion
 * from the previous one.
 */
export function ConversionFunnel() {
  const max = funnelStages[0].value;

  return (
    <section aria-label="Conversion" className="flex min-w-0 flex-col">
      <h2 className="text-base font-semibold">Conversion</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Visitor-to-customer funnel across the full journey
      </p>

      <ol className="mt-5 flex flex-1 flex-col justify-between gap-4">
        {funnelStages.map((stage, index) => {
          const previous = index > 0 ? funnelStages[index - 1].value : null;
          const stepRate = previous ? (stage.value / previous) * 100 : null;

          return (
            <li key={stage.stage}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span>{stage.stage}</span>
                <span className="flex items-baseline gap-2 tabular-nums">
                  {stepRate !== null && (
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(stepRate)} of previous
                    </span>
                  )}
                  <span className="w-16 text-right font-medium">
                    {formatNumber(stage.value)}
                  </span>
                </span>
              </div>
              <div
                role="presentation"
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-[var(--hui-color-background-accent-emphasis)]"
                  style={{ width: `${Math.max((stage.value / max) * 100, 1.5)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-xs text-muted-foreground">
        {formatPercent((funnelStages.at(-1)!.value / max) * 100, 1)} of visitors
        become paying customers end to end.
      </p>
    </section>
  );
}
