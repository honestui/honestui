import { GithubIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { getGithubStars } from "@/hooks/use-github-stars";
import Link from "next/link";
import ThemeSwitcher from "./theme-switcher";

const DocsHeader = async () => {
  const stars = await getGithubStars();

  return (
    <SidebarHeader className="bg-background pointer-events-none fixed top-0 z-50 flex h-14 w-full flex-row justify-between border-b p-0 sm:sticky sm:h-[35px] sm:border-b-0 sm:bg-transparent">
      <div className="pointer-events-auto flex items-center pl-3">
        <SidebarTrigger className="sidebar:hidden" />
      </div>
      <div className="pointer-events-auto relative z-10 flex h-full items-center gap-2 pl-6">
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
          variant="link"
        >
          <GithubIcon aria-hidden="true" className="size-4 text-primary" />
          {stars !== null && (
            <span aria-hidden="true" className="text-primary text-xs">
              {stars.toLocaleString("en-US")}
            </span>
          )}
        </Button>
        <span aria-hidden="true" className="text-muted">
          |
        </span>
        <ThemeSwitcher />
        <Button
          aria-label="Connor Love’s website (opens in a new tab)"
          className="group h-8"
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
            className="text-muted-foreground group-hover:text-primary text-xs"
          >
            Built by Connor Love
          </span>
        </Button>
      </div>
    </SidebarHeader>
  );
};

export default DocsHeader;
