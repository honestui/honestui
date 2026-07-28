import { PreviewRail } from "@/registry/default/animated/preview-rail";

const items = [
  { id: "inbox", label: "Inbox", description: "Triage new requests and mentions.", href: "#inbox" },
  { id: "projects", label: "Projects", description: "Track work across every active project.", href: "#projects" },
  { id: "reports", label: "Reports", description: "Review progress, health, and delivery trends.", href: "#reports" },
];

export default function PreviewRailDemo() {
  return <PreviewRail items={items} className="w-full max-w-xl p-6" />;
}
