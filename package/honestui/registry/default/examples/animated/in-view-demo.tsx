import { ArrowDown } from "honestui/icons";

import { InView } from "@/registry/default/animated/in-view";

const features = [
  { title: "Realtime sync", detail: "Edits appear for everyone within a second." },
  { title: "Version history", detail: "Restore any change from the last 90 days." },
  { title: "Granular access", detail: "Share a single view without the whole workspace." },
  { title: "Audit log", detail: "Every export and permission change, recorded." },
];

export default function InViewDemo() {
  return (
    <div className="h-80 w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden!">
      <div className="flex h-72 flex-col items-center justify-center gap-2 text-[13px] text-muted-foreground">
        Scroll inside the card
        <ArrowDown className="size-4" />
      </div>
      <div className="px-5 pb-6">
        <InView once={false} preset="blur">
          <h3 className="text-base font-semibold tracking-tight text-foreground">Built for teams</h3>
          <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
            Everything you need to work on the same thing at the same time.
          </p>
        </InView>
        <InView as="ul" once={false} preset="slide-up" stagger={0.08} className="mt-4 flex flex-col gap-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-[13px] font-medium text-foreground">{feature.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{feature.detail}</p>
            </div>
          ))}
        </InView>
      </div>
    </div>
  );
}
