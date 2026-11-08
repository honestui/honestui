"use client";

import * as React from "react";
import { Markdown } from "../ai/markdown.js";

type Entry = [string, unknown];

/** Where a sent message carries @ToAssistant's context; no form or $variable has this name. */
export const CONTEXT_KEY = "@context";
type Submission = { introduction: string; forms: { name: string; entries: Entry[] }[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Recognize the form-state suffix emitted by GeneratedBlock, including stored messages. */
function readSubmission(content: string): Submission | null {
  const separator = content.lastIndexOf("\n");
  if (separator < 0 || /^\s*```/m.test(content)) return null;
  const suffix = content.slice(separator + 1).trim();
  if (!suffix.startsWith("{")) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(suffix);
  } catch {
    return null;
  }
  if (!isRecord(payload)) return null;

  const forms: Submission["forms"] = [];
  const directEntries: Entry[] = [];
  for (const [name, fields] of Object.entries(payload)) {
    if (name === CONTEXT_KEY) {
      directEntries.push(["Details", fields]);
      continue;
    }
    // Actions outside a Form carry standalone fields and reactive $variables.
    if (/^\$[A-Za-z_]\w*$/.test(name)) {
      directEntries.push([name.slice(1), fields]);
      continue;
    }
    if (!isRecord(fields)) return null;
    if (Object.hasOwn(fields, "value")) {
      directEntries.push([name, fields.value]);
      continue;
    }
    const entries: Entry[] = [];
    for (const [fieldName, field] of Object.entries(fields)) {
      if (!isRecord(field) || !Object.hasOwn(field, "value")) return null;
      entries.push([fieldName, field.value]);
    }
    if (entries.length) forms.push({ name, entries });
  }
  if (directEntries.length) forms.push({ name: "", entries: directEntries });
  return forms.length ? { introduction: content.slice(0, separator), forms } : null;
}

function readableName(name: string) {
  if (/^q\d+$/i.test(name)) return name.toUpperCase();
  const words = name.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function SubmittedValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) return <span className="text-muted-foreground">No value</span>;
  if (value === "") return <span className="text-muted-foreground">Blank</span>;
  if (depth >= 8 && typeof value === "object") {
    return <pre className="max-w-full overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="m-0 grid list-none gap-1 p-0">
        {value.map((item, index) => <li key={index}><SubmittedValue value={item} depth={depth + 1} /></li>)}
      </ul>
    ) : <span className="text-muted-foreground">No items</span>;
  }
  if (isRecord(value)) {
    return Object.keys(value).length ? <SubmittedEntries entries={Object.entries(value)} depth={depth + 1} />
      : <span className="text-muted-foreground">No entries</span>;
  }
  return <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{String(value)}</span>;
}

function SubmittedEntries({ entries, depth = 0 }: { entries: Entry[]; depth?: number }) {
  return (
    <dl className="m-0 min-w-0">
      {entries.map(([name, value]) => (
        <div key={name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-4 border-t border-[var(--hui-color-border-base-secondary)] py-2 first:border-t-0 first:pt-0 last:pb-0">
          <dt className="min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere]">{readableName(name)}</dt>
          <dd className="m-0 min-w-0 text-sm"><SubmittedValue value={value} depth={depth} /></dd>
        </div>
      ))}
    </dl>
  );
}

/** "Here is my edited version of “Plan”…" blocks an artifact edit appends to a message. */
const EDIT = /(?:^|\n\n)(Here is my edited version|I restored the original version) of “([^\n]+?)”\. Use it for any further changes:\n\n(`{3,})[^\n]*\n([\s\S]*?)\n\3(?=\n|$)/g;

/** "About this part of “Plan”:" and the quoted passage, a selection asked about. */
const QUOTE = /(?:^|\n\n)About this part of “([^\n]+?)”:\n\n(>(?: [^\n]*)?(?:\n>(?: [^\n]*)?)*)/g;

/** "About these 2 rows from “Cities”:" and the chosen rows as a Markdown table. */
const ROWS = /(?:^|\n\n)About (?:this row|these \d+ rows) from (?:“([^\n]+?)”|the table):\n\n(\|[^\n]*\|(?:\n\|[^\n]*\|)*)/g;

/** `content` without its attached edits to the given artifact titles; other edits stay. */
export function withoutEdits(content: string, titles: ReadonlySet<string>): string {
  return content.replace(EDIT, (match, _lead: string, title: string) => (titles.has(title) ? "" : match));
}

/** `content` with `addition` placed before a trailing form-payload line, which must stay last. */
export function beforePayload(content: string, addition: string): string {
  if (!addition) return content;
  const lastBreak = content.lastIndexOf("\n");
  const lastLine = content.slice(lastBreak + 1).trim();
  return lastBreak >= 0 && lastLine.startsWith("{")
    ? content.slice(0, lastBreak) + addition + content.slice(lastBreak)
    : content + addition;
}

/** The reader's own words, and the artifact edits that went with them. */
export function readEdits(content: string): {
  text: string;
  edits: { title: string; body: string; restored?: boolean }[];
  quotes: { title: string; passage: string }[];
  rows: { title: string; table: string }[];
} {
  const edits: { title: string; body: string; restored?: boolean }[] = [];
  const quotes: { title: string; passage: string }[] = [];
  const rows: { title: string; table: string }[] = [];
  const text = content
    .replace(EDIT, (_, lead: string, title: string, _fence: string, body: string) => {
      edits.push(lead.startsWith("I restored") ? { title, body, restored: true } : { title, body });
      return "";
    })
    .replace(ROWS, (_, title: string | undefined, table: string) => {
      rows.push({ title: title ?? "", table });
      return "";
    })
    .replace(QUOTE, (_, title: string, lines: string) => {
      quotes.push({ title, passage: lines.split("\n").map((line) => line.replace(/^> ?/, "")).join("\n") });
      return "";
    })
    .trim();
  return { text, edits, quotes, rows };
}

/**
 * Present submitted values and attached artifact edits compactly, without
 * changing the content stored or sent to the model.
 */
export function UserMessageContent({ content }: { content: string }) {
  const { text, edits, quotes, rows } = readEdits(content);
  if (edits.length > 0 || quotes.length > 0 || rows.length > 0)
    return (
      <div className="grid min-w-0 gap-2" data-slot="message-with-edits">
        {/* A passage asked about comes first, as the reader's words answer it. */}
        {rows.map((chosen, i) => (
          <figure key={`rows-${i}`} className="m-0 grid min-w-0 gap-1 border-s-2 border-[var(--hui-color-border-base-primary)] ps-2.5 text-sm">
            <figcaption className="text-xs text-muted-foreground">From {chosen.title || "the table"}</figcaption>
            <div className="min-w-0 overflow-x-auto text-muted-foreground">
              <Markdown>{chosen.table}</Markdown>
            </div>
          </figure>
        ))}
        {quotes.map((quote, i) => (
<SentQuote key={`quote-${i}`} title={quote.title} passage={quote.passage} />
        ))}
        {text && <MessageBody content={text} />}
        {edits.map((edit, i) => (
          <details key={i} className="group min-w-0 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground outline-none focus-visible:[outline:var(--hui-focus-ring)] [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="motion-safe:transition-transform group-open:rotate-90">›</span>
              {edit.restored ? "Restored" : "Edited"}: {edit.title}
            </summary>
            <pre tabIndex={0} role="region" aria-label={`${edit.restored ? "Restored" : "Edited"}: ${edit.title}`} className="m-0 max-h-64 overflow-auto outline-none focus-visible:[outline:var(--hui-focus-ring)] border-t border-[var(--hui-color-border-base-primary)] px-2.5 py-2 font-mono text-xs whitespace-pre-wrap [overflow-wrap:anywhere]">
              {edit.body}
            </pre>
          </details>
        ))}
      </div>
    );
  return <MessageBody content={content} />;
}

/** A passage the reader asked about, above their words. */
function SentQuote({ title, passage }: { title: string; passage: string }) {
  const body = React.useRef<HTMLQuoteElement>(null);
  // Focusable only when it scrolls, so a long quote scrolls by keyboard in
  // every browser and a short one adds no empty tab stop.
  const [scrolls, setScrolls] = React.useState(false);
  React.useEffect(() => {
    const element = body.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setScrolls(element.scrollHeight > element.clientHeight + 1));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <figure className="m-0 grid min-w-0 gap-1 border-s-2 border-[var(--hui-color-border-base-primary)] ps-2.5 text-sm">
      <figcaption className="text-xs text-muted-foreground">From {title}</figcaption>
      <blockquote
        ref={body}
        tabIndex={scrolls ? 0 : undefined}
        aria-label={`Quote from ${title}`}
        className="m-0 max-h-24 overflow-auto rounded-[var(--hui-radius-1)] whitespace-pre-wrap text-muted-foreground outline-none [overflow-wrap:anywhere] focus-visible:[outline:var(--hui-focus-ring)]"
      >
        {passage}
      </blockquote>
    </figure>
  );
}

function MessageBody({ content }: { content: string }) {
  const submission = readSubmission(content);
  if (!submission) return <Markdown>{content}</Markdown>;
  return (
    <div className="min-w-0" data-slot="submitted-message">
      <Markdown>{submission.introduction}</Markdown>
      <div className="mt-3 grid min-w-0 gap-4" role="group" aria-label="Submitted values">
        {submission.forms.map((form) => (
          <div key={form.name} className="min-w-0">
            {form.name && submission.forms.length > 1 && <p className="mb-2 text-sm font-medium">{readableName(form.name)}</p>}
            <SubmittedEntries entries={form.entries} />
          </div>
        ))}
      </div>
    </div>
  );
}
