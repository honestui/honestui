import { InsightCard, InsightCards } from "@/registry/honest-ai/ai/insight-cards"

export default function InsightCardsSingleExample() {
  return (
    <div className="w-full max-w-md min-w-0">
      <InsightCards title="Latest insight">
        <InsightCard title="Export totals now match the ledger on all 1,204 invoices.">
          <p className="m-0 text-[var(--hui-color-foreground-base-secondary)]">
            With one card, the position and the buttons are left out.
          </p>
        </InsightCard>
      </InsightCards>
    </div>
  )
}
