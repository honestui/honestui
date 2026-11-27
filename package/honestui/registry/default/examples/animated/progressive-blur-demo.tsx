import { ProgressiveBlur } from "@/registry/default/animated/progressive-blur";

const items = [
  { title: "Deploy finished", detail: "Production is live on main", time: "2m" },
  { title: "New comment", detail: "Avery replied on the pricing page", time: "9m" },
  { title: "Invoice paid", detail: "Northwind paid INV-2041", time: "24m" },
  { title: "Review requested", detail: "Sam asked for a review on #482", time: "1h" },
  { title: "Usage alert", detail: "API usage reached 80% of the plan", time: "2h" },
  { title: "Teammate joined", detail: "Jordan accepted the invite", time: "3h" },
  { title: "Backup complete", detail: "Nightly snapshot stored in us-east", time: "5h" },
  { title: "Domain verified", detail: "docs.example.com is ready", time: "8h" },
];

export default function ProgressiveBlurDemo() {
  return (
    <div className="relative h-80 w-80 overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-full overflow-y-auto px-4 py-10 [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden!">
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.title} className="rounded-lg border border-border bg-background px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{item.time}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <ProgressiveBlur direction="top" intensity={8} className="absolute inset-x-0 top-0 h-12" />
      <ProgressiveBlur direction="bottom" className="absolute inset-x-0 bottom-0 h-24" />
    </div>
  );
}
