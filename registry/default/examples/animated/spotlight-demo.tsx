import { Database, Globe, Lock, Zap } from "honestui/icons";

import { Spotlight, SpotlightCard } from "@/registry/default/animated/spotlight";

const cards = [
  { icon: Zap, title: "Edge functions", detail: "Run code within 50 ms of every user." },
  { icon: Database, title: "Managed storage", detail: "Postgres and blobs, backed up nightly." },
  { icon: Lock, title: "Access control", detail: "Roles, SSO, and audit logs built in." },
  { icon: Globe, title: "Global CDN", detail: "Assets cached in over 100 regions." },
];

export default function SpotlightDemo() {
  return (
    <Spotlight className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map(({ icon: Icon, title, detail }) => (
        <SpotlightCard key={title} className="p-4">
          <span className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{detail}</p>
        </SpotlightCard>
      ))}
    </Spotlight>
  );
}
