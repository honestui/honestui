"use client"

import { InsightCard, InsightCards } from "@/registry/honest-ai/ai/insight-cards"
import { BarChart, type ChartConfig } from "honestui/charts"
import { LineChart } from "honestui/charts"
import { PieChart } from "honestui/charts"

// Sample figures.
const failedRuns = [
  { week: "Sep 1", failed: 9 },
  { week: "Sep 8", failed: 7 },
  { week: "Sep 15", failed: 8 },
  { week: "Sep 22", failed: 4 },
  { week: "Sep 29", failed: 3 },
  { week: "Oct 6", failed: 2 },
]

const failedRunsConfig = {
  // Ink on paper: one quiet series needs no hue. The gray scale flips with the
  // theme, so the same steps read in light and dark.
  failed: { label: "Failed runs", colors: { light: ["var(--hui-gray-10)"], dark: ["var(--hui-gray-10)"] } },
} satisfies ChartConfig

const lateInvoices = [
  { supplier: "harbor", invoices: 10 },
  { supplier: "northwind", invoices: 7 },
  { supplier: "others", invoices: 7 },
]

const lateInvoicesConfig = {
  harbor: { label: "Harbor Paper Co.", colors: { light: ["var(--hui-gray-12)"], dark: ["var(--hui-gray-12)"] } },
  northwind: { label: "Northwind Dairy", colors: { light: ["var(--hui-gray-10)"], dark: ["var(--hui-gray-10)"] } },
  others: { label: "All others", colors: { light: ["var(--hui-gray-7)"], dark: ["var(--hui-gray-7)"] } },
} satisfies ChartConfig

const replyTimes = [
  { day: "Mon", agent: 42, team: 95 },
  { day: "Tue", agent: 38, team: 110 },
  { day: "Wed", agent: 35, team: 88 },
  { day: "Thu", agent: 31, team: 102 },
  { day: "Fri", agent: 29, team: 97 },
]

const replyTimesConfig = {
  agent: { label: "Agent", colors: { light: ["var(--hui-gray-12)"], dark: ["var(--hui-gray-12)"] } },
  team: { label: "Team", colors: { light: ["var(--hui-gray-8)"], dark: ["var(--hui-gray-8)"] } },
} satisfies ChartConfig

const chartFrame = "h-44 w-full min-w-0"
const summary = "m-0 text-[var(--hui-color-foreground-base-secondary)]"

/**
 * The charts start drawn, so the evidence is there when a card appears.
 * Each card states its finding, plots it with an Honest UI chart, and then
 * gives the plotted values as text, because a canvas does not expose them.
 */
export default function InsightCardsDemo() {
  return (
    <div className="w-full max-w-md min-w-0">
      <InsightCards title="Insights">
        <InsightCard title="Failed runs fell from 9 to 2 a week after the rounding fix.">
          <div className={chartFrame}>
            <BarChart data={failedRuns} config={failedRunsConfig} animation={false} className="h-full w-full">
              <BarChart.Grid />
              <BarChart.XAxis dataKey="week" />
              <BarChart.YAxis />
              <BarChart.Tooltip />
              <BarChart.Bar dataKey="failed" variant="default" />
            </BarChart>
          </div>
          <p className={summary}>
            Failed runs per week, oldest first: {failedRuns.map((row) => row.failed).join(", ")}.
          </p>
        </InsightCard>

        <InsightCard title="Two suppliers account for 71% of late invoices.">
          <div className={chartFrame}>
            <PieChart
              data={lateInvoices}
              dataKey="invoices"
              nameKey="supplier"
              config={lateInvoicesConfig}
              animation={false}
              className="h-full w-full"
            >
              <PieChart.Legend />
              <PieChart.Tooltip />
              <PieChart.Pie innerRadius="36%" outerRadius="64%" />
            </PieChart>
          </div>
          <p className={summary}>
            Of 24 late invoices this quarter, Harbor Paper Co. sent 10, Northwind Dairy 7, and all
            other suppliers 7.
          </p>
        </InsightCard>

        <InsightCard title="The agent's first reply is about three times faster than the team's.">
          <div className={chartFrame}>
            <LineChart
              data={replyTimes}
              config={replyTimesConfig}
              xDataKey="day"
              animation={false}
              className="h-full w-full"
            >
              <LineChart.Grid />
              <LineChart.XAxis dataKey="day" />
              <LineChart.Legend />
              <LineChart.Tooltip />
              <LineChart.Line dataKey="team" strokeVariant="dashed" strokeWidth={2} />
              <LineChart.Line dataKey="agent" strokeVariant="solid" strokeWidth={2} />
            </LineChart>
          </div>
          <p className={summary}>
            Median minutes to first reply this week: agent 29 to 42, team 88 to 110.
          </p>
        </InsightCard>
      </InsightCards>
    </div>
  )
}
