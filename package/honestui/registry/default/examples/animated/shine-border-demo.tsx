import { ShineBorder } from "@/registry/default/animated/shine-border";

export default function ShineBorderDemo() {
  return (
    <div className="relative w-80 rounded-xl border border-border bg-card p-5">
      <p className="text-[13px] text-muted-foreground">Pro plan</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        $24<span className="text-sm font-normal text-muted-foreground"> / month</span>
      </p>
      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <li>Unlimited projects</li>
        <li>Priority support</li>
        <li>Audit log and SSO</li>
      </ul>
      <ShineBorder />
    </div>
  );
}
