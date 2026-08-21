import { ArrowUpRight } from "honestui/icons";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { HONEST_UI_EXAMPLES } from "@/lib/examples";

export function ExamplesGrid() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-[var(--hui-space-7)]">
      {HONEST_UI_EXAMPLES.map((example, index) => (
        <Card
          key={example.previewHref}
          className="gap-0 overflow-hidden py-0"
          variant="outline"
        >
          <CardPanel className="p-0">
            <Link
              href={example.previewHref}
              aria-label={`Preview ${example.name}`}
              className="group relative block aspect-[16/10] overflow-hidden bg-[var(--hui-color-background-neutral-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
            >
              <Image
                src={example.previewImage}
                alt={example.previewImageAlt}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 768px, calc(100vw - 3rem)"
                className="object-cover object-top motion-safe:[transition:transform_var(--hui-duration-moderate)_var(--hui-ease-out)] group-hover:scale-[1.005] dark:hidden"
              />
              <Image
                src={example.previewImageDark}
                alt={example.previewImageAlt}
                fill
                sizes="(min-width: 1024px) 768px, calc(100vw - 3rem)"
                className="hidden object-cover object-top motion-safe:[transition:transform_var(--hui-duration-moderate)_var(--hui-ease-out)] group-hover:scale-[1.005] dark:block"
              />
            </Link>
          </CardPanel>

          <div className="flex flex-col gap-[var(--hui-space-5)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-5)] sm:flex-row sm:items-center sm:justify-between">
            <CardHeader className="min-w-0 flex-1 gap-[var(--hui-space-2)] p-0">
              <CardTitle className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]">
                {example.name}
              </CardTitle>
              <CardDescription className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
                {example.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="shrink-0 p-0">
              <Button
                render={<Link href={example.previewHref} />}
                size="sm"
                variant="secondary"
              >
                Preview example
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Button>
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  );
}
