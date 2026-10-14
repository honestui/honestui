"use client";

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

/** Present submitted values without changing the content stored or sent to the model. */
export function UserMessageContent({ content }: { content: string }) {
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
