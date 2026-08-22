import { ArrowUpRight } from "honestui/icons";

import { SharedLayoutBg } from "@/registry/default/animated/shared-layout-bg";

const links = ["Guides", "Templates", "Changelog"];

export default function SharedLayoutBgDemo() {
  return (
    <SharedLayoutBg className="w-full max-w-sm" inset={12}>
      {links.map((label) => (
        <a
          key={label}
          href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
          className="block w-full px-3 py-3 text-sm font-medium"
        >
          <span className="flex w-full items-center justify-between gap-4">
            <span>{label}</span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
          </span>
        </a>
      ))}
    </SharedLayoutBg>
  );
}
