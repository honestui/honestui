import { GithubIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { getGithubStars } from "@/hooks/use-github-stars";
import Link from "next/link";
import ThemeSwitcher from "./theme-switcher";

const DocsHeader = async () => {
  const stars = await getGithubStars();

  return (
    <SidebarHeader className="bg-background pointer-events-none fixed top-0 z-50 flex h-14 w-full flex-row justify-between border-b p-0 sm:static sm:h-11 sm:shrink-0 sm:border-b-0 sm:bg-transparent">
      <div className="pointer-events-auto flex items-center pl-3">
        <SidebarTrigger className="sidebar:hidden" />
      </div>
      <div className="pointer-events-auto relative z-10 flex h-full items-center gap-1 pr-1 pl-6">
        <Button
          aria-label={
            stars === null
              ? "Honest UI on GitHub (opens in a new tab)"
              : "Honest UI on GitHub, " +
                stars.toLocaleString("en-US") +
                " stars (opens in a new tab)"
          }
          render={
            <Link
              href="https://github.com/honestui/honestui"
              rel="noreferrer"
              target="_blank"
            />
          }
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2"
        >
          <GithubIcon aria-hidden="true" className="size-4" />
          {stars !== null && (
            <span aria-hidden="true" className="text-xs tabular-nums">
              {stars.toLocaleString("en-US")}
            </span>
          )}
        </Button>
        <ThemeSwitcher />
        <span aria-hidden="true" className="bg-border mx-1 h-4 w-px" />
        <Button
          aria-label="Connor Love’s website (opens in a new tab)"
          className="group h-8 px-2"
          render={
            <Link
              href="https://connorlove.com"
              rel="noreferrer"
              target="_blank"
            />
          }
          size="sm"
          variant="ghost"
        >
          <span
            aria-hidden="true"
            className="text-muted-foreground group-hover:text-foreground text-xs"
          >
            Built by Connor Love
          </span>
        </Button>
      </div>
    </SidebarHeader>
  );
};

export default DocsHeader;
