import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = { title: "Revenue" };

export default function RevenuePage() {
  return <PagePlaceholder title="Revenue" />;
}
