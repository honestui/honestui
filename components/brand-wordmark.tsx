import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function BrandWordmark({
  className,
  markClassName,
  showWordmark = true,
}: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[11px] font-sans leading-none",
        className,
      )}
    >
      <Image
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        width={64}
        height={64}
        className={cn(
          "size-7 shrink-0 dark:invert",
          markClassName,
        )}
      />
      {showWordmark && (
        <span className="inline-flex items-baseline tracking-[-0.025em]">
          <span className="font-semibold">Honest</span>
          <span className="ml-[0.24em] font-medium text-muted-foreground">
            UI
          </span>
        </span>
      )}
    </span>
  );
}
