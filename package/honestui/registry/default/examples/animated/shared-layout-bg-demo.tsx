import { ArrowUpRight } from "honestui/icons";

import { SharedLayoutBg } from "@/registry/default/animated/shared-layout-bg";

const links = [
  { label: "Guides", description: "Step-by-step setup and recipes" },
  { label: "Templates", description: "Starting points for common screens" },
  { label: "Changelog", description: "What shipped this month" },
];

export default function SharedLayoutBgDemo() {
  return (
    <SharedLayoutBg className="w-full max-w-sm" inset={8}>
      {links.map(({ label, description }) => (
        <a
          key={label}
          href={`#${label.toLowerCase()}`}
          className="group block w-full px-1 py-2.5 outline-none"
        >
          <span className="flex w-full items-center justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{label}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{description}</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </span>
        </a>
      ))}
    </SharedLayoutBg>
  );
}
