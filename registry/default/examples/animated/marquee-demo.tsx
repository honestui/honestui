import { Marquee } from "@/registry/default/animated/marquee";

const items = ["Keyboard first", "Reduced motion", "Composable", "Source owned", "Responsive"];

export default function MarqueeDemo() {
  return (
    <Marquee speed={22} gap="0.75rem" className="w-full py-4">
      {items.map((item) => (
        <span key={item} className="rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
          {item}
        </span>
      ))}
    </Marquee>
  );
}
