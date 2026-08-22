import { Bell, CreditCard, ShieldCheck } from "honestui/icons";

import { BouncyAccordion } from "@/registry/default/animated/bouncy-accordion";

const items = [
  {
    id: "payment",
    title: "Payment method",
    description: "Change the card used for your team plan and future renewals.",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "security",
    title: "Security checks",
    description: "Review sign-in devices, backup codes, and account recovery.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    id: "email-updates",
    title: "Email updates",
    description: "Choose which team activity and weekly summaries you receive.",
    icon: <Bell className="size-4" />,
  },
];

export default function BouncyAccordionDemo() {
  return (
    <BouncyAccordion
      items={items}
      defaultValue="payment"
      className="w-full max-w-md p-6"
      classNames={{ item: "border border-border" }}
    />
  );
}
