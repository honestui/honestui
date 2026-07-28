import { Bell, CreditCard, ShieldCheck } from "lucide-react";

import { BouncyAccordion } from "@/registry/default/animated/bouncy-accordion";

const items = [
  {
    id: "billing",
    title: "Billing details",
    description: "Update the card and address used for your workspace subscription.",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "security",
    title: "Security",
    description: "Manage passkeys, active sessions, and recovery methods.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose which product and account updates reach your inbox.",
    icon: <Bell className="size-4" />,
  },
];

export default function BouncyAccordionDemo() {
  return (
    <BouncyAccordion
      items={items}
      defaultValue="billing"
      className="w-full max-w-md p-6"
      classNames={{ item: "border border-border" }}
    />
  );
}
