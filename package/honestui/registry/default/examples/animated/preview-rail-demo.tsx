import { PreviewRail } from "@/registry/default/animated/preview-rail";

const items = [
  { id: "overview", label: "Overview", description: "See what changed across your workspace.", href: "#overview" },
  { id: "tasks", label: "Tasks", description: "Review the work your team is moving forward.", href: "#tasks" },
  { id: "insights", label: "Insights", description: "Spot recent patterns in progress and delivery.", href: "#insights" },
];

export default function PreviewRailDemo() {
  return <PreviewRail items={items} className="w-full max-w-xl p-6" />;
}
