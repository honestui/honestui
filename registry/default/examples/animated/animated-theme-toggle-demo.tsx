import { ThemeToggle } from "@/registry/default/animated/theme-toggle";

export default function AnimatedThemeToggleDemo() {
  return (
    <ThemeToggle
      variant="circle-blur"
      start="center"
      className="size-12 rounded-full border bg-card shadow-sm"
      iconClassName="size-5"
    />
  );
}
