import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type TokenPreview =
  | "blur"
  | "color"
  | "radius"
  | "shadow"
  | "spacing"
  | "typography"
  | "value";

export interface TokenDefinition {
  name: string;
  value?: string;
  description: string;
}

interface TokenTableProps {
  caption: string;
  tokens: TokenDefinition[];
  type?: TokenPreview;
  className?: string;
}

function TokenSample({ token, type }: { token: TokenDefinition; type: TokenPreview }) {
  const variable = `var(${token.name})`;

  if (type === "color") {
    return (
      <span
        aria-hidden="true"
        className="block size-7 rounded-[var(--hui-radius-1)] border border-[var(--hui-color-border-base-primary)]"
        style={{ backgroundColor: variable }}
      />
    );
  }

  if (type === "spacing") {
    return (
      <span aria-hidden="true" className="flex h-7 min-w-32 items-center">
        <span
          className="block h-2 max-w-full bg-[var(--hui-color-background-accent-emphasis)]"
          style={{ width: variable }}
        />
      </span>
    );
  }

  if (type === "radius") {
    return (
      <span
        aria-hidden="true"
        className="block h-8 w-14 bg-[var(--hui-color-background-accent-emphasis)]"
        style={{ borderRadius: token.value ?? variable }}
      />
    );
  }

  if (type === "shadow") {
    return (
      <span
        aria-hidden="true"
        className="block h-8 w-14 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)]"
        style={{ boxShadow: variable }}
      />
    );
  }

  if (type === "blur") {
    return (
      <span
        aria-hidden="true"
        className="grid h-12 w-28 grid-rows-[1rem_1fr] overflow-hidden rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]"
        data-token-preview="blur"
      >
        <span className="grid grid-cols-2 px-2 text-[9px] leading-4 text-[var(--hui-color-foreground-base-secondary)]">
          <span>Sharp</span>
          <span className="text-right">Blurred</span>
        </span>
        <span
          className="relative block overflow-hidden"
          style={{
            background:
              "repeating-conic-gradient(var(--hui-color-background-danger-emphasis) 0 25%, var(--hui-color-background-accent-emphasis) 0 50%) 0 0 / 12px 12px",
          }}
        >
          <span
            className="absolute inset-y-0 right-0 w-1/2 border-l border-[var(--hui-color-overlay-white-a8)] bg-[var(--hui-color-overlay-white-a5)]"
            data-token-preview-effect="blur"
            style={{ backdropFilter: variable }}
          />
        </span>
      </span>
    );
  }

  if (type === "typography") {
    const style: CSSProperties = {};

    if (token.name.includes("font-size")) style.fontSize = variable;
    if (token.name.includes("line-height")) style.lineHeight = variable;
    if (token.name.includes("letter-spacing")) style.letterSpacing = variable;
    if (token.name.includes("font-weight")) style.fontWeight = variable;
    if (["--hui-font-love-sans", "--hui-font-title", "--hui-font-body", "--hui-font-mono"].includes(token.name)) {
      style.fontFamily = variable;
    }

    return (
      <span aria-hidden="true" className="block whitespace-nowrap" style={style}>
        Aa
      </span>
    );
  }

  return <span className="text-[var(--hui-color-foreground-base-tertiary)]">—</span>;
}

export function TokenTable({ caption, tokens, type = "value", className }: TokenTableProps) {
  const hasPreview = type !== "value";

  return (
    <div
      className={cn(
        "no-scrollbar my-6 w-full overflow-x-auto rounded-[var(--hui-radius-3)] border border-[var(--hui-color-border-base-primary)]",
        className,
      )}
    >
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]">
            {hasPreview ? (
              <th scope="col" className="w-36 px-4 py-3 font-medium">
                Preview
              </th>
            ) : null}
            <th scope="col" className="px-4 py-3 font-medium">
              Token
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Value
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Use
            </th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr
              key={`${token.name}-${token.value ?? "theme"}`}
              className="border-b border-[var(--hui-color-border-base-primary)] last:border-b-0"
            >
              {hasPreview ? (
                <td className="px-4 py-3">
                  <TokenSample token={token} type={type} />
                </td>
              ) : null}
              <th scope="row" className="px-4 py-3 font-normal">
                <code className="whitespace-nowrap">{token.name}</code>
              </th>
              <td className="px-4 py-3 text-[var(--hui-color-foreground-base-secondary)]">
                {token.value ?? "Theme-aware"}
              </td>
              <td className="px-4 py-3 text-[var(--hui-color-foreground-base-secondary)]">
                {token.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
