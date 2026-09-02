import type { Metadata } from "next";

import { AcquisitionSection } from "@/components/dashboard/acquisition-section";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { CustomersSection } from "@/components/dashboard/customers-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DateRangeProvider } from "@/components/dashboard/date-range-context";
import { MetricOverview } from "@/components/dashboard/metric-overview";
import { QuickInsight } from "@/components/dashboard/quick-insight";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RetentionSection } from "@/components/dashboard/retention-section";
import { RevenueSection } from "@/components/dashboard/revenue-section";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <DateRangeProvider>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader />
        <MetricOverview />
        <RevenueSection />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <AcquisitionSection />
          <ConversionFunnel />
        </div>
        <RetentionSection />
        <CustomersSection />
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-12">
          <RecentActivity />
          <QuickInsight />
        </div>
      </div>
    </DateRangeProvider>
  );
}
