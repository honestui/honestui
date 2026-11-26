// Component code taken from shadcn docs
// Huge Thanks to him :3

"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover } from "@/components/ui/popover";
import { CheckIcon, CopyIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "honestui/icons";
import { Grok } from "honestui/logos";
import { useClipboard } from "@mantine/hooks";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function DocsCopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { copy, copied } = useClipboard({ timeout: 1000 });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={cn(
        "text-muted-foreground hover:text-foreground size-5 rounded opacity-70 hover:opacity-100",
        className,
      )}
      onClick={() => copy(value)}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

function getPromptUrl(baseURL: string, url: string) {
  return `${baseURL}?q=${encodeURIComponent(
    `I’m looking at this Honest UI documentation: ${url}.
Help me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.
  `,
  )}`;
}

const menuItems = {
  // Same-origin view, a RELATIVE href, so it works on localhost/previews too.
  // The absolute SITE_URL would point at production, which may not have this
  // page deployed yet. The AI links below genuinely want absolute prod URLs.
  markdown: (_url: string, path: string) => (
    <a href={`${path}.md`} target="_blank" rel="noopener noreferrer">
      <svg strokeLinejoin="round" viewBox="0 0 22 16">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.5 2.25H2.5C1.80964 2.25 1.25 2.80964 1.25 3.5V12.5C1.25 13.1904 1.80964 13.75 2.5 13.75H19.5C20.1904 13.75 20.75 13.1904 20.75 12.5V3.5C20.75 2.80964 20.1904 2.25 19.5 2.25ZM2.5 1C1.11929 1 0 2.11929 0 3.5V12.5C0 13.8807 1.11929 15 2.5 15H19.5C20.8807 15 22 13.8807 22 12.5V3.5C22 2.11929 20.8807 1 19.5 1H2.5ZM3 4.5H4H4.25H4.6899L4.98715 4.82428L7 7.02011L9.01285 4.82428L9.3101 4.5H9.75H10H11V5.5V11.5H9V7.79807L7.73715 9.17572L7 9.97989L6.26285 9.17572L5 7.79807V11.5H3V5.5V4.5ZM15 8V4.5H17V8H19.5L17 10.5L16 11.5L15 10.5L12.5 8H15Z"
          fill="currentColor"
        />
      </svg>
      View as Markdown
    </a>
  ),
  chatgpt: (url: string) => (
    <a href={getPromptUrl("https://chatgpt.com", url)} target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
          fill="currentColor"
        />
      </svg>
      Open in ChatGPT
    </a>
  ),
  claude: (url: string) => (
    <a href={getPromptUrl("https://claude.ai/new", url)} target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="m4.714 15.956 4.718-2.648.079-.23-.08-.128h-.23l-.79-.048-2.695-.073-2.337-.097-2.265-.122-.57-.121-.535-.704.055-.353.48-.321.685.06 1.518.104 2.277.157 1.651.098 2.447.255h.389l.054-.158-.133-.097-.103-.098-2.356-1.596-2.55-1.688-1.336-.972-.722-.491L2 6.223l-.158-1.008.655-.722.88.06.225.061.893.686 1.906 1.476 2.49 1.833.364.304.146-.104.018-.072-.164-.274-1.354-2.446-1.445-2.49-.644-1.032-.17-.619a2.972 2.972 0 0 1-.103-.729L6.287.133 6.7 0l.995.134.42.364.619 1.415L9.735 4.14l1.555 3.03.455.898.243.832.09.255h.159V9.01l.127-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.583.28.48.685-.067.444-.286 1.851-.558 2.903-.365 1.942h.213l.243-.242.983-1.306 1.652-2.064.728-.82.85-.904.547-.431h1.032l.759 1.129-.34 1.166-1.063 1.347-.88 1.142-1.263 1.7-.79 1.36.074.11.188-.02 2.853-.606 1.542-.28 1.84-.315.832.388.09.395-.327.807-1.967.486-2.307.462-3.436.813-.043.03.049.061 1.548.146.662.036h1.62l3.018.225.79.522.473.638-.08.485-1.213.62-1.64-.389-3.825-.91-1.31-.329h-.183v.11l1.093 1.068 2.003 1.81 2.508 2.33.127.578-.321.455-.34-.049-2.204-1.657-.85-.747-1.925-1.62h-.127v.17l.443.649 2.343 3.521.122 1.08-.17.353-.607.213-.668-.122-1.372-1.924-1.415-2.168-1.141-1.943-.14.08-.674 7.254-.316.37-.728.28-.607-.461-.322-.747.322-1.476.388-1.924.316-1.53.285-1.9.17-.632-.012-.042-.14.018-1.432 1.967-2.18 2.945-1.724 1.845-.413.164-.716-.37.066-.662.401-.589 2.386-3.036 1.439-1.882.929-1.086-.006-.158h-.055L4.138 18.56l-1.13.146-.485-.456.06-.746.231-.243 1.907-1.312Z"
          fill="currentColor"
        />
      </svg>
      Open in Claude
    </a>
  ),
  perplexity: (url: string) => (
    <a
      href={getPromptUrl("https://www.perplexity.ai/search/new", url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.25V21.75M6.86501 8.2865V3.2915L12 8.2865M12 8.2865L6.86501 13.505V20.7085L12 15.5365M12 8.2865L17.135 3.2915V8.2865" />
        <path d="M6.865 15.698H4.72V8.2865H19.28V15.698H17.135" />
        <path d="M12 8.2865L17.135 13.505V20.7085L12 15.5365" />
      </svg>
      Open in Perplexity
    </a>
  ),
  grok: (url: string) => (
    <a href={getPromptUrl("https://grok.com/", url)} target="_blank" rel="noopener noreferrer">
      <Grok />
      Open in Grok
    </a>
  ),
  v0: (url: string) => (
    <a href={getPromptUrl("https://v0.dev", url)} target="_blank" rel="noopener noreferrer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 147 70"
        className="size-4.5 -translate-x-px"
      >
        <path d="M56 50.203V14h14v46.156C70 65.593 65.593 70 60.156 70c-2.596 0-5.158-1-7-2.843L0 14h19.797L56 50.203ZM147 56h-14V23.953L100.953 56H133v14H96.687C85.814 70 77 61.186 77 50.312V14h14v32.156L123.156 14H91V0h36.312C138.186 0 147 8.814 147 19.688V56Z" />
      </svg>
      <span className="-translate-x-[2px]">Open in v0</span>
    </a>
  ),
};

type CopyPageState = "idle" | "loading" | "copied" | "error";

const copyPageLabels: Record<CopyPageState, string> = {
  idle: "Copy Page",
  loading: "Loading…",
  copied: "Copied",
  error: "Retry",
};

export function DocsCopyPage({ url, path }: { url: string; path: string }) {
  const [copyState, setCopyState] = useState<CopyPageState>("idle");
  const resetTimerRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      window.clearTimeout(resetTimerRef.current ?? undefined);
    },
    [],
  );

  async function copyPage() {
    requestRef.current?.abort();
    window.clearTimeout(resetTimerRef.current ?? undefined);

    const request = new AbortController();
    requestRef.current = request;
    setCopyState("loading");

    try {
      const response = await fetch(`${path}.md`, {
        headers: { accept: "text/markdown" },
        signal: request.signal,
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok || !/^text\/(?:markdown|plain)\b/i.test(contentType)) {
        throw new Error(`Markdown request failed with status ${response.status}`);
      }

      await navigator.clipboard.writeText(await response.text());
      setCopyState("copied");
      resetTimerRef.current = window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCopyState("error");
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  }

  const trigger = (
    <Button
      variant="secondary"
      size="sm"
      aria-label="Open dropdown menu"
      className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-none border-0 border-l-[0.5px] border-[var(--hui-color-border-base-primary)] bg-transparent p-0! hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:ring-0! data-popup-open:[&>svg]:rotate-180"
    >
      <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-200 ease-out motion-reduce:transition-none" />
    </Button>
  );

  return (
    <Popover>
      <div className="group/buttons relative flex overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] select-none *:data-[slot=button]:focus-visible:relative *:data-[slot=button]:focus-visible:z-10">
        <Button
          aria-busy={copyState === "loading"}
          aria-label={copyState === "error" ? "Copy failed — retry" : undefined}
          disabled={copyState === "loading"}
          variant="secondary"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 rounded-none border-0 bg-transparent px-2! text-xs duration-0 hover:bg-[var(--hui-color-background-base-primary-hover)]"
          onClick={copyPage}
        >
          {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
          {/* Stack every label in one grid cell so the button keeps the width of
              the widest label; otherwise the header's title column reflows when
              the label changes and the page content jumps. */}
          <span className="grid">
            {(Object.keys(copyPageLabels) as CopyPageState[]).map((state) => (
              <span
                key={state}
                aria-hidden={state !== copyState}
                className={cn("col-start-1 row-start-1", state !== copyState && "invisible")}
              >
                {copyPageLabels[state]}
              </span>
            ))}
          </span>
        </Button>
        <span className="sr-only" role="status">
          {copyState === "copied"
            ? "Page copied to the clipboard."
            : copyState === "error"
              ? "The page could not be copied. Try again."
              : ""}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={trigger} />
          <DropdownMenuContent align="end" className="bg-background rounded-lg">
            {Object.entries(menuItems).map(([key, value]) => (
              <DropdownMenuItem
                className="hover:bg-muted/50! text-muted-foreground/80 hover:text-primary! cursor-pointer text-[13px]"
                key={key}
                render={value(url, path)}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Popover>
  );
}
