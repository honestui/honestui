import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <PagePlaceholder title="Analytics" />;
}
