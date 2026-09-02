import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  return <PagePlaceholder title="Customers" />;
}
