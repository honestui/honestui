import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <PagePlaceholder title="Reports" />;
}
