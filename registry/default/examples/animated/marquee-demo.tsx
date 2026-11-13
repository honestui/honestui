import { Marquee } from "@/registry/default/animated/marquee";

const items = ["Clear by default", "Motion aware", "Easy to adapt", "Built in React", "Ready for touch"];

export default function MarqueeDemo() {
  return (
    <Marquee speed={22} gap="0.5rem" className="w-full py-4">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium text-foreground"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/50" />
          {item}
        </span>
      ))}
    </Marquee>
  );
}
