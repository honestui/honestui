import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <PagePlaceholder title="Settings" />;
}
