import type { Metadata } from "next";

import { CrmCustomerList } from "@/components/examples/crm-customer-list";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "CRM App - Customer List",
  description: "An Honest UI CRM customer-list example.",
  alternates: {
    canonical: absoluteUrl("/examples/crm-customer-list"),
  },
};

export default function CrmCustomerListPage() {
  return <CrmCustomerList />;
}
