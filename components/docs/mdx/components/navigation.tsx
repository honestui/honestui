import { ChevronLeft, ChevronRight } from "honestui/icons";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
interface MDXNavigationProps {
  type: "previous" | "next";
  $id?: string;
  title: ReactNode;
  description: ReactNode;
  url: string;
}

export const MDXNavigation = ({ type, title, url, description }: MDXNavigationProps) => {
  return (
    <Link
      href={url}
      className="block rounded-md outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-2"
    >
      {/* Hover: the frame lightens a step, the inner card's border firms up,
          the title and chevron go to primary ink, and the chevron nudges in
          its direction. */}
      <div
        className={cn(
          "group text-muted-foreground flex cursor-pointer rounded-md bg-[var(--hui-color-background-neutral-primary)] p-[2px] transition-colors duration-200 hover:bg-[var(--hui-color-background-neutral-secondary)]",
          type === "previous" ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div className="bg-background flex flex-1 flex-col gap-0.5 rounded-md border-[0.5px] border-[var(--hui-color-border-base-primary)] p-3 transition-colors duration-200 group-hover:border-[var(--hui-color-border-base-secondary)]">
          <span className="group-hover:text-foreground line-clamp-1 text-[13px] capitalize transition-colors duration-200">
            {title}
          </span>
          <span className="text-muted-foreground line-clamp-1 text-xs">{description}</span>
        </div>
        <div
          className={cn(
            "group-hover:text-foreground flex items-center transition-[color,translate] duration-200 motion-reduce:transition-colors sm:px-2",
            type === "previous" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5",
          )}
        >
          {type === "previous" ? (
            <ChevronLeft strokeWidth={1.5} className="size-5" />
          ) : (
            <ChevronRight strokeWidth={1.5} className="size-5" />
          )}
        </div>
      </div>
    </Link>
  );
};
