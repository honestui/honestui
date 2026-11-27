import { Meteors } from "@/registry/default/animated/meteors";

export default function MeteorsDemo() {
  return (
    <div className="relative flex h-64 w-full max-w-md flex-col justify-end overflow-hidden rounded-xl border border-border bg-card p-6">
      <Meteors number={16} />
      <p className="relative text-[13px] text-muted-foreground">Changelog</p>
      <p className="relative mt-1 text-lg font-semibold tracking-tight text-foreground">Faster cold starts, everywhere.</p>
    </div>
  );
}
