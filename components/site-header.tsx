import Link from "next/link";

import { GithubIcon } from "@/assets/icons";
import { BrandWordmark } from "@/components/brand-wordmark";
import ThemeSwitcher from "@/components/docs/sidebar/theme-switcher";
import { Button } from "@/components/ui/button";
import { getGithubStars } from "@/hooks/use-github-stars";

export async function SiteHeader() {
  const stars = await getGithubStars();

  return (
    <header>
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Honest UI home"
          className="rounded-[var(--hui-radius-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
        >
          <BrandWordmark className="text-[17px]" markClassName="size-7" />
        </Link>

        <nav aria-label="Site links" className="flex items-center gap-2">
          <Button
            aria-label={
              stars === null
                ? "Honest UI on GitHub (opens in a new tab)"
                : `Honest UI on GitHub, ${stars.toLocaleString("en-US")} stars (opens in a new tab)`
            }
            className="hidden h-8 sm:inline-flex"
            render={
              <Link
                href="https://github.com/honestui/honestui"
                target="_blank"
                rel="noreferrer"
              />
            }
            size="sm"
            variant="link"
          >
            <GithubIcon aria-hidden="true" className="size-4" />
            {stars !== null && (
              <span aria-hidden="true" className="text-xs tabular-nums">
                {stars.toLocaleString("en-US")}
              </span>
            )}
          </Button>
          <ThemeSwitcher />
          <Button
            className="h-8"
            render={
              <Link
                href="https://connorlove.com"
                target="_blank"
                rel="noreferrer"
              />
            }
            size="sm"
            variant="ghost"
          >
            <span className="text-[var(--hui-color-foreground-base-secondary)]">
              Made by Connor
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
