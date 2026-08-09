import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { useGithubStars } from "@/hooks/use-github-stars";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "./theme-switcher";
import { GithubIcon } from "@/assets/icons";
import Link from "next/link";

const DocsHeader = async () => {
  // its a fucking custom function shutup fucking eslint
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const stars = await useGithubStars();

  return (
    <SidebarHeader className="bg-background pointer-events-none fixed top-0 z-50 flex h-14 w-full flex-row justify-between border-b p-0 sm:sticky sm:h-[35px] sm:border-b-0 sm:bg-transparent">
      <div className="pointer-events-auto flex items-center pl-3">
        <SidebarTrigger className="sidebar:hidden" />
      </div>
      <div className="pointer-events-auto relative z-10 flex h-full items-center gap-2 pl-6">
        <Link
          href="https://github.com/honestui/honestui"
          target="_blank"
          aria-label="Honest UI on GitHub"
        >
          <Button variant="link" size="sm">
            <GithubIcon className="size-4 text-primary" />
            {stars !== null && (
              <span className="text-primary text-xs">{stars}</span>
            )}
          </Button>
        </Link>
        <span className="text-muted">|</span>
        <ThemeSwitcher />
        <Link href="https://connorlove.com" target="_blank">
          <Button className="group h-8" size="sm" variant="ghost">
            <span className="text-muted-foreground group-hover:text-primary text-xs">
              {" "}
              Built by Connor Love
            </span>
          </Button>
        </Link>
      </div>
    </SidebarHeader>
  );
};

export default DocsHeader;
