"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { useStore, type StoreApi } from "zustand";
import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Pencil as PencilIcon,
} from "honestui/icons";
import { Textarea } from "../../../components/ui/textarea.js";
import { Markdown } from "../../ai/markdown.js";
import { Button } from "../../../components/ui/button.js";
import { cn } from "../../../lib/utils.js";
import { ArtifactCard, ArtifactPanel } from "../../ai/artifact-panel.js";
import { useIsStreaming } from "../runtime/react";
import { DetailedViewContext } from "../runtime/headless/store/DetailedViewContext";
import type { DetailedViewStore } from "../runtime/headless/store/detailedViewTypes";
import { ChatContext } from "../runtime/headless/store/ChatContext";
import type { ChatStore } from "../runtime/headless/store/types";
import type { Message } from "../runtime/headless";
import { fileName } from "./block-actions";
import { InsideCardContext, array, record, takeStopped, text, type Props } from "./shared";

type Render = (value: unknown) => React.ReactNode;

/** File extensions for a code artifact's language. */
const EXTENSIONS: Record<string, string> = {
  typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx",
  python: "py", py: "py", rust: "rs", go: "go", java: "java", ruby: "rb",
  shell: "sh", bash: "sh", sh: "sh", sql: "sql", html: "html", css: "css",
  json: "json", yaml: "yml", yml: "yml", markdown: "md", md: "md", swift: "swift",
  kotlin: "kt", c: "c", cpp: "cpp", "c++": "cpp", csharp: "cs", "c#": "cs", php: "php",
};

/** How a language is named to a reader. */
const LANGUAGE_NAMES: Record<string, string> = {
  typescript: "TypeScript", ts: "TypeScript", tsx: "TSX", javascript: "JavaScript", js: "JavaScript",
  jsx: "JSX", python: "Python", py: "Python", rust: "Rust", go: "Go", java: "Java", ruby: "Ruby",
  shell: "shell", bash: "Bash", sh: "shell", sql: "SQL", html: "HTML", css: "CSS", json: "JSON",
  yaml: "YAML", yml: "YAML", swift: "Swift", kotlin: "Kotlin", c: "C", cpp: "C++", "c++": "C++",
  csharp: "C#", "c#": "C#", php: "PHP",
};

/**
 * What Edit opens, said in its tooltip: Markdown for written text (no
 * language), the named language for code, or plain "source" for code whose
 * language isn't known.
 */
function editTooltip(language: string | undefined) {
  if (language === undefined || language === "markdown" || language === "md") return "Edit as Markdown";
  const name = LANGUAGE_NAMES[language];
  return name ? `Edit the ${name} source` : "Edit the source";
}

/**
 * What the artifact was written as, so Copy and Download keep its Markdown
 * and code rather than the rendered text: a lone code block as its code
 * (with a matching file extension), otherwise Markdown. Null when the
 * content is all components (a chart, a form) with no written source.
 */
export type ArtifactSource = {
  text: string;
  extension: string;
  /** The code block's language, when the artifact is one code file. */
  language?: string;
  /** False when the artifact also holds components (a chart, a table) the text leaves out. */
  complete: boolean;
};

const WRITTEN = new Set(["MarkDownRenderer", "TextContent", "CodeBlock"]);

export function artifactSource(children: unknown): ArtifactSource | null {
  const nodes = array(children).map(record);
  const parts: string[] = [];
  const complete = nodes.every((node) => WRITTEN.has(text(node.typeName)));
  const code = nodes.filter((node) => node.typeName === "CodeBlock");
  if (nodes.length === 1 && code.length === 1) {
    const props = record(code[0].props);
    const language = text(props.language).toLowerCase();
    return {
      text: text(props.codeString),
      extension: EXTENSIONS[language] ?? "txt",
      language,
      complete: true,
    };
  }
  for (const node of nodes) {
    const props = record(node.props);
    if (node.typeName === "MarkDownRenderer") parts.push(text(props.textMarkdown));
    else if (node.typeName === "TextContent") parts.push(text(props.text));
    else if (node.typeName === "CodeBlock") {
      const fence = fenceFor(text(props.codeString), text(props.language));
      parts.push(`${fence.open}\n${text(props.codeString)}\n${fence.close}`);
    }
  }
  return parts.length ? { text: parts.join("\n\n"), extension: "md", complete } : null;
}

/**
 * Artifacts in one chat, by title, in the order they mounted: a later one
 * with the same title is a revision of the earlier, so its card says which
 * version it is. One registry per chat store, read as an external store.
 */
type Registry = { byTitle: Map<string, string[]>; listeners: Set<() => void> };
const registries = new WeakMap<object, Registry>();
function registryFor(store: object): Registry {
  let registry = registries.get(store);
  if (!registry) {
    registry = { byTitle: new Map(), listeners: new Set() };
    registries.set(store, registry);
  }
  return registry;
}

function useVersion(store: object, title: string, viewId: string) {
  const registry = registryFor(store);
  React.useEffect(() => {
    const list = registry.byTitle.get(title) ?? [];
    if (!list.includes(viewId)) registry.byTitle.set(title, [...list, viewId]);
    registry.listeners.forEach((listener) => listener());
    return () => {
      registry.byTitle.set(
        title,
        (registry.byTitle.get(title) ?? []).filter((id) => id !== viewId),
      );
      registry.listeners.forEach((listener) => listener());
    };
  }, [registry, title, viewId]);
  const snapshot = React.useSyncExternalStore(
    (listener) => {
      registry.listeners.add(listener);
      return () => registry.listeners.delete(listener);
    },
    () => (registry.byTitle.get(title) ?? [viewId]).join("|"),
    () => viewId,
  );
  const versions = snapshot.split("|");
  const index = Math.max(0, versions.indexOf(viewId));
  return {
    number: index + 1,
    total: versions.length,
    previous: versions[index - 1],
    next: versions[index + 1],
  };
}

/** A Markdown fence one backtick longer than any run in `body`, so the body cannot close it. */
function fenceFor(body: string, language = "") {
  const longest = Math.max(2, ...(body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return { open: fence + language, close: fence };
}

/**
 * Edits the reader saved but the assistant has not seen, per chat. They go
 * with the reader's next message (see peekArtifactEdits), so a revision
 * asked for in the composer starts from the reader's version.
 */
type PendingEdit = {
  title: string;
  text: string;
  language?: string;
  /** The original, sent back after the model had seen an edit. */
  restored?: boolean;
  /** A passage the reader selected to ask about, not a new version. */
  quote?: boolean;
  /** How many table rows `text` holds, as a Markdown table, when the reader chose rows to ask about. */
  rows?: number;
  /** The chosen rows' first cells ("Cairo, Lima"), telling one set of rows from another. */
  names?: string;
  /**
   * The conversation a quote or chosen rows belong to. They outlive what
   * they came from (a chat switch unmounts it) and go only with a message in
   * that conversation. Unset for an artifact edit, which its artifact keeps.
   */
  thread?: string | null;
  revision: number;
};
type PendingRegistry = {
  edits: Map<string, PendingEdit>;
  /** Artifacts whose edit a reply carried; each artifact records it once. */
  delivered: Set<string>;
  /** Artifacts whose edit the reader chose not to send. */
  dismissed: Set<string>;
  listeners: Set<() => void>;
};
const pendingByStore = new WeakMap<object, PendingRegistry>();
function pendingFor(store: object): PendingRegistry {
  let registry = pendingByStore.get(store);
  if (!registry) {
    registry = { edits: new Map(), delivered: new Set(), dismissed: new Set(), listeners: new Set() };
    pendingByStore.set(store, registry);
  }
  return registry;
}
let nextRevision = 1;
/** Records (or, with null, drops) the reader's saved edit to one artifact. Artifacts call this; exported for tests and custom panels. */
export function setPending(store: object, viewId: string, edit: Omit<PendingEdit, "revision"> | null) {
  const registry = pendingFor(store);
  // Each save is its own revision, so settling a send never removes an edit
  // saved after that send began.
  if (edit) registry.edits.set(viewId, { ...edit, revision: nextRevision++ });
  else registry.edits.delete(viewId);
  registry.listeners.forEach((listener) => listener());
}
function editMessage(edit: Omit<PendingEdit, "revision">) {
  if (edit.rows)
    return `About ${edit.rows === 1 ? "this row" : `these ${edit.rows} rows`} from ${
      edit.title ? `“${edit.title}”` : "the table"
    }:\n\n${edit.text}`;
  if (edit.quote)
    return `About this part of “${edit.title}”:\n\n${edit.text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n")}`;
  const fence = fenceFor(edit.text, edit.language ?? "markdown");
  const lead = edit.restored
    ? `I restored the original version of “${edit.title}”.`
    : `Here is my edited version of “${edit.title}”.`;
  return `${lead} Use it for any further changes:\n\n${fence.open}\n${edit.text}\n${fence.close}`;
}

/**
 * The reader's unsent artifact edits, for showing them by the composer, and
 * a way to drop one. Empty outside a chat.
 */
/** Each quote is its own attachment, so asking twice keeps both. */
let nextQuote = 0;

/** Drops every unsent attachment whose id starts with `prefix`, as when what it came from goes away. */
export function clearPending(store: object, prefix: string) {
  for (const id of [...pendingFor(store).edits.keys()]) if (id.startsWith(prefix)) setPending(store, id, null);
}

/** Whether the reader's keyboard has ⌘ rather than Ctrl for shortcuts. */
function appleShortcuts() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/** The prompt box of the chat that holds `element`, if there is one. */
export function composerNear(element: Element | null): HTMLElement | null {
  for (let at = element?.parentElement; at; at = at.parentElement) {
    const found = at.querySelector<HTMLElement>('[data-slot="prompt-bar-input"]');
    if (found) return found;
  }
  return null;
}

/** The composer if it can take focus now: not disabled by a running reply, nor behind a covering panel. */
export function readyComposerNear(element: Element | null): HTMLElement | null {
  const composer = composerNear(element);
  return composer && !composer.matches(":disabled") && !composer.closest("[inert]") ? composer : null;
}

/** The start of a quoted passage, short enough for a chip. */
function excerpt(passage: string) {
  const flat = passage.replace(/\s+/g, " ").trim();
  return flat.length > 32 ? `${flat.slice(0, 31).trimEnd()}…` : flat;
}

/** Whether an attachment goes with a message in `thread`. */
const inThread = (edit: PendingEdit, thread: string | null | undefined) =>
  edit.thread === undefined || thread === undefined || edit.thread === thread;

export function usePendingArtifactEdits(store: object | null, thread?: string | null) {
  const registry = store ? pendingFor(store) : null;
  const snapshot = React.useSyncExternalStore(
    (listener) => {
      registry?.listeners.add(listener);
      return () => registry?.listeners.delete(listener);
    },
    () =>
      registry
        ? [...registry.edits.entries()]
            .filter(([, edit]) => inThread(edit, thread))
            .map(
              ([id, edit]) =>
                `${id}\u0000${edit.title}\u0000${
                  edit.rows ? "rows" : edit.quote ? "quote" : edit.restored ? "restored" : "edit"
                }\u0000${edit.rows ? String(edit.rows) : edit.quote ? excerpt(edit.text) : ""}\u0000${edit.revision}\u0000${
                  edit.names ? excerpt(edit.names) : ""
                }`,
            )
            .join("\u0001")
        : "",
    () => "",
  );
  const edits = snapshot
    ? snapshot.split("\u0001").map((entry) => {
        const [viewId, title, kind, passage, revision, names] = entry.split("\u0000");
        return { viewId, title, kind: kind as "edit" | "restored" | "quote" | "rows", passage, revision, names };
      })
    : [];
  // Not sent is not delivered: the artifact records the reader's choice.
  const remove = (viewId: string) => {
    if (!store) return;
    pendingFor(store).dismissed.add(viewId);
    setPending(store, viewId, null);
  };
  return { edits, remove };
}

/**
 * The reader's unsent artifact edits as text to append to their next
 * message, without clearing them: a send that fails or is stopped keeps them
 * for the retry. Pass `ids` to settleArtifactEdits once the send succeeds.
 * Call it with the chat's detailed-view store (DetailedViewContext).
 */
export type SentEdits = { text: string; ids: string[]; revisions: number[] };

export function peekArtifactEdits(store: object | null, thread?: string | null): SentEdits {
  if (!store) return { text: "", ids: [], revisions: [] };
  const entries = [...pendingFor(store).edits.entries()].filter(([, edit]) => inThread(edit, thread));
  if (entries.length === 0) return { text: "", ids: [], revisions: [] };
  return {
    text: "\n\n" + entries.map(([, edit]) => editMessage(edit)).join("\n\n"),
    ids: entries.map(([id]) => id),
    revisions: entries.map(([, edit]) => edit.revision),
  };
}

/** Clears the exact edits a successful send carried; one saved since then stays. */
export function settleArtifactEdits(store: object | null, sent: Pick<SentEdits, "ids" | "revisions">) {
  if (!store || sent.ids.length === 0) return;
  const registry = pendingFor(store);
  sent.ids.forEach((id, i) => {
    if (registry.edits.get(id)?.revision === sent.revisions[i]) {
      registry.edits.delete(id);
      registry.delivered.add(id);
    }
  });
  registry.listeners.forEach((listener) => listener());
}

/**
 * Whether a reply began among the messages a send added: assistant text, a
 * tool call, or a tool's result. The one test every send path uses, so a run
 * that ended after a tool call is not mistaken for no reply.
 */
export function replyBegan(messages: readonly Message[]): boolean {
  return messages.some(
    (message) =>
      message.role === "tool" ||
      (message.role === "assistant" &&
        ((typeof message.content === "string" && message.content.length > 0) ||
          (message.toolCalls?.length ?? 0) > 0)),
  );
}

/**
 * Follows one send of `sent` to its end, by the composer's rule: a reply that
 * began means the model has the edit, so it settles; a send that fails or is
 * stopped before any reply leaves the thread, and the edit stays attached.
 */
function settleWhenDelivered(
  store: object,
  chat: StoreApi<ChatStore> | null,
  sent: SentEdits,
  onUndone?: () => void,
) {
  if (!chat) return;
  const before = chat.getState().messages;
  let started = false;
  // A send that never starts (one already running) is not followed further.
  setTimeout(() => {
    if (!started && !chat.getState().isRunning) unsubscribe();
  }, 0);
  const unsubscribe = chat.subscribe((state) => {
    if (state.isRunning) {
      started = true;
      return;
    }
    if (!started) return;
    unsubscribe();
    // This send's Stop, if any, ends here, so it can't hide a later notice.
    const stopped = takeStopped(chat);
    if (replyBegan(state.messages.slice(before.length))) settleArtifactEdits(store, sent);
    else {
      state.setMessages(before);
      if (!stopped) onUndone?.();
    }
  });
}

/**
 * Saved edits kept in this browser, per conversation and artifact, so they
 * survive a reload or a switch between chats. `sent` says whether the
 * assistant has had it; an unsent one goes with the next message again.
 */
const EDIT_STORAGE_PREFIX = "honest-ai:artifact-edit:";
/** Saved edits older than this are dropped, so document text does not linger on a shared machine. */
const EDIT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
type StoredEdit = {
  text: string;
  sent: boolean;
  savedAt?: number;
  /** The reader chose not to send it. */
  dismissed?: boolean;
  /** It tells the assistant the original is back, after an edit it had seen. */
  restored?: boolean;
  /** The assistant has had some edit to this artifact, so a later restore must tell it. */
  seen?: boolean;
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Removes the reader's saved artifact edits from this browser: those for one
 * conversation, or all of them. Call it when a conversation is deleted or a
 * person signs out. Expired edits are also removed whenever edits are read.
 */
export function clearArtifactEdits(threadId?: string) {
  const store = storage();
  if (!store) return;
  const prefix = threadId ? `${EDIT_STORAGE_PREFIX}${threadId}:` : EDIT_STORAGE_PREFIX;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => store.removeItem(key));
}

/** Removes saved edits past their 30 days from this browser. */
export function sweepExpiredEdits() {
  const store = storage();
  if (!store) return;
  const now = Date.now();
  const expired: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key?.startsWith(EDIT_STORAGE_PREFIX)) continue;
    try {
      const value = JSON.parse(store.getItem(key) ?? "null") as StoredEdit | null;
      if (!value?.savedAt || now - value.savedAt > EDIT_LIFETIME_MS) expired.push(key);
    } catch {
      expired.push(key);
    }
  }
  expired.forEach((key) => store.removeItem(key));
}

function editKey(threadId: string | null | undefined, title: string, version: number, identity: string) {
  return threadId ? `${EDIT_STORAGE_PREFIX}${threadId}:${version}:${identity}:${title}` : null;
}

/** The storage key for an artifact's saved edit; exported for tests. */
export function artifactEditKey(threadId: string, title: string, version: number, children: unknown) {
  return editKey(threadId, title, version, fingerprint(JSON.stringify(children ?? null)));
}

/** A short, stable fingerprint of a string (FNV-1a). */
function fingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function readStoredEdit(key: string | null): StoredEdit | null {
  if (!key) return null;
  sweepExpiredEdits();
  try {
    const value = JSON.parse(storage()?.getItem(key) ?? "null") as Partial<StoredEdit> | null;
    return value && typeof value.text === "string"
      ? {
          text: value.text,
          sent: value.sent === true,
          savedAt: value.savedAt,
          dismissed: value.dismissed === true,
          restored: value.restored === true,
          seen: value.seen === true,
        }
      : null;
  } catch {
    return null;
  }
}

function writeStoredEdit(key: string | null, value: Omit<StoredEdit, "savedAt"> | null) {
  if (!key) return;
  try {
    if (value) storage()?.setItem(key, JSON.stringify({ ...value, savedAt: Date.now() }));
    else storage()?.removeItem(key);
  } catch {
    // Storage can be blocked or full; the edit then lasts for this session.
  }
}

/**
 * A deliverable the reader keeps, such as a document, a plan or a code file:
 * a card in the reply that opens the content in the panel beside the
 * conversation. Outside a chat, with no panel to open, it renders in place.
 */
export function GeneratedArtifact({ props, renderNode }: { props: Props; renderNode: Render }) {
  const store = React.useContext(DetailedViewContext);
  const title = text(props.title) || "Untitled";
  const description = text(props.description) || undefined;
  if (!store)
    return (
      <section aria-label={title} className="grid gap-3">
        <h2 data-slot="inline-header-title" className="m-0 text-base font-semibold">
          {title}
        </h2>
        {renderNode(props.children)}
      </section>
    );
  return (
    <ArtifactWithPanel
      store={store}
      title={title}
      description={description}
      source={artifactSource(props.children)}
      identity={fingerprint(JSON.stringify(props.children ?? null))}
    >
      {renderNode(props.children)}
    </ArtifactWithPanel>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

function ArtifactWithPanel({
  store,
  title,
  description,
  source,
  identity,
  children,
}: {
  store: StoreApi<DetailedViewStore>;
  title: string;
  description?: string;
  source: ArtifactSource | null;
  /** A fingerprint of what the model wrote, so a saved edit never lands on a different artifact with the same title. */
  identity: string;
  children: React.ReactNode;
}) {
  const streaming = useIsStreaming();
  const chat = React.useContext(ChatContext);
  // While a reply streams a new message cannot start, so Send now waits.
  const chatRunning = React.useSyncExternalStore(
    (listener) => (chat ? chat.subscribe(listener) : () => {}),
    () => chat?.getState().isRunning ?? false,
    () => false,
  );
  const viewId = `artifact:${React.useId()}`;
  const isOpen = useStore(store, (state) => state.activeDetailedViewId === viewId);
  const target = useStore(store, (state) => state._detailedViewPanelNode);
  const version = useVersion(store, title, viewId);
  const card = React.useRef<HTMLButtonElement>(null);
  const panel = React.useRef<HTMLElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  // The result of the last Copy, heard by a screen reader and, if it failed, seen.
  const [copied, setCopied] = React.useState<"copied" | "failed" | null>(null);
  // An edit the reader saved replaces the written source here; the model's
  // version is one Cancel away until then, and a new version from the model
  // arrives as its own artifact.
  const [edited, setEdited] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<string | null>(null);
  // While editing, the draft shown as it will read once saved.
  const [previewing, setPreviewing] = React.useState(false);
  const editor = React.useRef<HTMLTextAreaElement>(null);
  // A first Escape over unsaved changes asks; a second discards them.
  const [discardArmed, setDiscardArmed] = React.useState(false);
  /** Ends editing, with focus back on Edit rather than lost with the form. */
  const leaveEdit = () => {
    setDraft(null);
    setPreviewing(false);
    setDiscardArmed(false);
    requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLElement>('[data-slot="artifact-edit"]')?.focus(),
    );
  };
  const [sendNowFailed, setSendNowFailed] = React.useState(false);
  // Text the reader selected in the panel, and where to offer to ask about it.
  const [selection, setSelection] = React.useState<{ text: string; top: number; left: number } | null>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const onChange = () => {
      const current = window.getSelection();
      const root = body.current;
      if (!current || current.isCollapsed || current.rangeCount === 0 || !root) return setSelection(null);
      const range = current.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return setSelection(null);
      const quoted = current.toString().trim();
      if (!quoted) return setSelection(null);
      const box = range.getBoundingClientRect();
      const frame = root.getBoundingClientRect();
      setSelection({ text: quoted, top: box.bottom - frame.top + 6, left: Math.max(0, box.left - frame.left) });
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      // A selection made before the panel closed may be gone by the time it
      // reopens, so it is never offered again.
      setSelection(null);
    };
  }, [isOpen]);
  /** Attaches the selected passage to the next message, like an edit. */
  const askAboutSelection = () => {
    if (!selection) return;
    setPending(store, `${viewId}:quote:${nextQuote++}`, {
      title,
      text: selection.text,
      quote: true,
      thread: chat?.getState().selectedThreadId ?? null,
    });
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    // The reader types the question next, so the caret goes to the composer
    // (its chip is there). A panel covering the chat closes to show it.
    // Focus moves within the tap itself, which is what lets a phone raise its
    // keyboard.
    const composer = composerNear(card.current);
    // While a reply runs the composer is disabled and can't take focus.
    const ready = composer && !composer.matches(":disabled") ? composer : null;
    if (covering) {
      // Closing returns focus to the card; the composer takes it if it can.
      close();
      ready?.focus();
      return;
    }
    (ready ?? panel.current)?.focus();
  };
  const pending = pendingFor(store);
  const storageKey = () => editKey(chat?.getState().selectedThreadId, title, version.number, identity);
  // An unsent edit belongs to this artifact's conversation. Switching or
  // starting a chat unmounts the artifact, and its edit goes with it, so it
  // can never be sent in another conversation.
  React.useEffect(
    () => () => {
      setPending(store, viewId, null);
    },
    [store, viewId, pending],
  );
  const unsent = React.useSyncExternalStore(
    (listener) => {
      pending.listeners.add(listener);
      return () => pending.listeners.delete(listener);
    },
    () => pending.edits.has(viewId),
    () => false,
  );
  // A narrow layout puts the panel over everything; there it is a modal.
  // Re-checked as the window or panel resizes (a rotated tablet, a widened
  // window), so a panel that moves beside the chat stops trapping focus.
  const [covering, setCovering] = React.useState(false);
  React.useEffect(() => {
    if (!isOpen || !target) return;
    const check = () => setCovering(getComputedStyle(target).position === "fixed");
    const frame = requestAnimationFrame(check);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    observer?.observe(target);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [isOpen, target]);
  const modal = isOpen && covering;

  const open = React.useCallback(() => store.getState().setActiveDetailedView(viewId), [store, viewId]);
  // Undoes the inert background of a covering panel. Called before focus
  // moves back out, since an inert element can't take focus.
  const releaseBackground = React.useRef<(() => void) | null>(null);
  const close = React.useCallback(() => {
    if (store.getState().activeDetailedViewId !== viewId) return;
    releaseBackground.current?.();
    store.getState().setActiveDetailedView(null);
    // Back to where the reader opened it from.
    card.current?.focus({ preventScroll: true });
  }, [store, viewId]);

  // An artifact being written opens beside the chat, as one does in Claude
  // or ChatGPT; one restored from history waits to be opened. Where the panel
  // would cover the conversation (a narrow layout), it waits for a tap, so it
  // never hides the reply or its Stop button while the reply is arriving.
  const openedWhileStreaming = React.useRef(false);
  React.useEffect(() => {
    if (!streaming || openedWhileStreaming.current || !target) return;
    openedWhileStreaming.current = true;
    if (getComputedStyle(target).position !== "fixed") open();
  }, [streaming, open, target]);

  // Where the panel covers the conversation (a narrow layout puts it over
  // everything), it is a modal: focus moves in, stays in, and Escape closes
  // it from anywhere. Beside the conversation it stays non-modal.
  React.useEffect(() => {
    if (!modal) return;
    // What the panel covers is out of reach for every input and for
    // assistive technology, not only for Tab: each sibling along the panel's
    // ancestors becomes inert. Popups portaled in later stay usable.
    const covered: HTMLElement[] = [];
    for (let at = panel.current; at && at !== document.body; at = at.parentElement) {
      for (const sibling of at.parentElement?.children ?? []) {
        if (sibling === at || !(sibling instanceof HTMLElement) || sibling.inert) continue;
        sibling.inert = true;
        covered.push(sibling);
      }
    }
    const release = () => {
      covered.forEach((element) => (element.inert = false));
      covered.length = 0;
    };
    releaseBackground.current = release;
    const frame = requestAnimationFrame(() => panel.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      // A popup inside the panel (a Select's list, a date picker) is portaled
      // outside it and handles its own Escape and Tab; leave those keys to it.
      if (event.defaultPrevented) return;
      const inPanel = event.target instanceof Node && panel.current?.contains(event.target);
      const onPage = event.target === document.body || event.target === document.documentElement;
      if (!inPanel && !onPage) return;
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!panel.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      release();
      if (releaseBackground.current === release) releaseBackground.current = null;
    };
  }, [modal, close]);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), copied === "failed" ? 5000 : 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const status = streaming ? "streaming" : "complete";
  const versionNote = version.total > 1 ? `Version ${version.number} of ${version.total}` : undefined;
  // Moving between versions shows that version's panel in place of this one.
  const showVersion = (id: string | undefined) => {
    if (!id) return;
    setSelection(null);
    store.getState().setActiveDetailedView(id);
    // The button pressed is in the panel just hidden; focus follows to the
    // version now showing.
    requestAnimationFrame(() =>
      [...document.querySelectorAll<HTMLElement>("[data-view-id]")]
        .find((element) => element.dataset.viewId === id)
        ?.focus(),
    );
  };
  const note = [versionNote, edited !== null ? "Edited" : undefined, description].filter(Boolean).join(" · ") || undefined;
  const editable = !!source?.complete;
  // An edit saved in an earlier session comes back, and one the assistant
  // hadn't seen yet is attached to the next message again.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = readStoredEdit(storageKey());
      if (!stored) return;
      // A restoration shows the original; an edit shows the edit.
      if (!stored.restored) setEdited(stored.text);
      if (!stored.sent && !stored.dismissed)
        setPending(store, viewId, {
          title,
          text: stored.text,
          language: source?.language,
          restored: stored.restored || undefined,
        });
    });
    return () => cancelAnimationFrame(frame);
    // Once per artifact and version: later saves update storage directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId, version.number]);
  // When the edit leaves the composer, storage records why: a reply carried
  // it (sent; a delivered restoration is simply done), or the reader chose
  // not to send it (dismissed, so it doesn't come back next time).
  React.useEffect(() => {
    if (unsent) return;
    const key = storageKey();
    const stored = readStoredEdit(key);
    if (!stored || stored.sent) return;
    if (pending.delivered.delete(viewId)) {
      // A delivered restoration is done; the model is back on the original.
      writeStoredEdit(key, stored.restored ? null : { ...stored, sent: true, seen: true });
    } else if (pending.dismissed.delete(viewId)) {
      writeStoredEdit(key, { ...stored, dismissed: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unsent]);
  const sourceText = () => edited ?? source?.text ?? body.current?.innerText.trim() ?? "";
  const partial = !!source && !source.complete;

  const content = (
    <ArtifactPanel
      ref={panel}
      tabIndex={-1}
      hidden={!isOpen}
      data-slot="generated-artifact-panel"
      data-view-id={viewId}
      role={modal ? "dialog" : undefined}
      aria-modal={modal || undefined}
      title={title}
      description={note}
      status={status}
      onClose={close}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) close();
      }}
      actions={
        !streaming &&
        draft === null && (
          <>
            {version.total > 1 && (
              <span className="me-1 flex items-center">
                <Button
                  variant="link"
                  size="icon-sm"
                  aria-label={`Previous version of ${title}`}
                  title="Previous version"
                  disabled={!version.previous}
                  onClick={() => showVersion(version.previous)}
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                  {version.number}/{version.total}
                </span>
                <Button
                  variant="link"
                  size="icon-sm"
                  aria-label={`Next version of ${title}`}
                  title="Next version"
                  disabled={!version.next}
                  onClick={() => showVersion(version.next)}
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              </span>
            )}
            {editable && draft === null && (
              <Button
                variant="link"
                size="icon-sm"
                data-slot="artifact-edit"
                aria-label={`Edit ${title}`}
                // Edit opens the source, so the tooltip says which kind.
                title={editTooltip(source?.language)}
                onClick={() => {
                  setPreviewing(false);
                  setDraft(edited ?? source!.text);
                }}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="link"
              size="icon-sm"
              aria-label={
                source && !partial ? `Copy ${title}` : partial ? `Copy the text of ${title}, without its charts and tables` : `Copy ${title} as text`
              }
              title={source && !partial ? "Copy source" : partial ? "Copy text only" : "Copy text"}
              onClick={async () => {
                const value = sourceText();
                if (!value) return;
                try {
                  await navigator.clipboard.writeText(value);
                  setCopied("copied");
                } catch {
                  // The text stays selectable in the panel.
                  setCopied("failed");
                }
              }}
            >
              {copied === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
            </Button>
            <span role="status" className="sr-only">
              {copied === "copied" ? "Copied" : copied === "failed" ? "Couldn’t copy. Select the text to copy it." : ""}
            </span>
            {/* Only content written as text (Markdown, code) has a file to
                download; a chart, form or visual does not. */}
            {source && (
            <Button
                variant="link"
                size="icon-sm"
                aria-label={
                  partial ? `Download the text of ${title}, without its charts and tables` : `Download ${title}`
                }
                title={partial ? "Download text only" : "Download"}
                onClick={() => {
                  const value = sourceText();
                  if (!value) return;
                  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = fileName(title, source?.extension ?? "txt");
                  link.click();
                  // Older Safari can cancel a download whose URL is revoked at once.
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <DownloadIcon aria-hidden="true" />
              </Button>
            )}
          </>
        )
      }
      // The panel's own display would override the hidden attribute.
      className={isOpen ? "h-full outline-none" : "!hidden"}
    >
      {/* The panel is the frame, so cards inside drop their own. */}
      <InsideCardContext.Provider value>
        {draft !== null ? (
          <form
            className="grid h-full min-h-0 grid-rows-[1fr_auto] gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              // An empty artifact has nothing to keep, copy or send.
              if (!draft.trim()) return;
              // Nothing changed: nothing is marked edited or sent.
              if (draft === (edited ?? source?.text ?? "")) {
                leaveEdit();
                return;
              }
              setEdited(draft);
              setPending(store, viewId, { title, text: draft, language: source?.language });
              // A later save keeps the record that the model saw an earlier edit.
              const previous = readStoredEdit(storageKey());
              writeStoredEdit(storageKey(), {
                text: draft,
                sent: false,
                seen: previous?.seen || previous?.sent || undefined,
              });
              leaveEdit();
            }}
            // Escape backs out one level wherever focus is in the editor:
            // from the preview to the text, then out of the edit, asking
            // first if that would throw away changes. A key that ends an
            // input method's composition is left to it.
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              // Escape that ends an input method's composition is the input
              // method's: it reaches neither this form nor the panel.
              event.stopPropagation();
              if (event.nativeEvent.isComposing) return;
              event.preventDefault();
              event.stopPropagation();
              if (previewing) {
                setPreviewing(false);
                requestAnimationFrame(() => editor.current?.focus());
              } else if (discardArmed || draft === (edited ?? source?.text ?? "")) leaveEdit();
              else setDiscardArmed(true);
            }}
          >
            {previewing && (
              <div
                tabIndex={0}
                role="region"
                aria-label={`Preview of ${title}`}
                className="min-h-80 overflow-auto rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] p-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"
              >
                <Markdown>
                  {source?.language !== undefined
                    ? `${fenceFor(draft, source.language).open}\n${draft}\n${fenceFor(draft).close}`
                    : draft}
                </Markdown>
              </div>
            )}
            {/* Hidden, not removed, while previewing, so its undo history stays. */}
            <div hidden={previewing} className="min-h-0">
            <Textarea
              ref={editor}
              aria-label={`Edit ${title}`}
              value={draft}
              autoFocus
              onChange={(event) => {
                setDraft(event.target.value);
                setDiscardArmed(false);
              }}
              onKeyDown={(event) => {
                // Cmd or Ctrl+Enter saves, as in a chat composer.
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                  return;
                }
              }}
              className="min-h-80 font-mono text-sm [&_textarea]:min-h-80"
            />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                disabled={!draft.trim()}
                aria-keyshortcuts="Meta+Enter Control+Enter"
                title={`Save (${appleShortcuts() ? "⌘ Enter" : "Ctrl + Enter"})`}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                // Like Escape, Cancel asks before throwing changes away.
                onClick={() => {
                  if (discardArmed || draft === (edited ?? source?.text ?? "")) leaveEdit();
                  else setDiscardArmed(true);
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                  // Back from the preview, the caret returns to the text.
                  if (previewing) requestAnimationFrame(() => editor.current?.focus());
                  setPreviewing(!previewing);
                  // A warning about discarding applies to the moment it was given.
                  setDiscardArmed(false);
                }}>
                {previewing ? "Back to editing" : "Preview"}
              </Button>
              {edited !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    // If the assistant already has the reader's version, it
                    // hears that the original is back; otherwise the edit
                    // simply never goes.
                    const previous = readStoredEdit(storageKey());
                    const wasSent = previous?.seen === true || previous?.sent === true;
                    setEdited(null);
                    if (wasSent && source) {
                      // Kept like an edit until a reply carries it, so a chat
                      // switch or reload doesn't lose the correction.
                      setPending(store, viewId, { title, text: source.text, language: source.language, restored: true });
                      writeStoredEdit(storageKey(), { text: source.text, sent: false, restored: true, seen: true });
                    } else {
                      setPending(store, viewId, null);
                      writeStoredEdit(storageKey(), null);
                    }
                    leaveEdit();
                  }}
                >
                  Restore original
                </Button>
              )}
              <span role="status" className="text-xs text-muted-foreground">
                {discardArmed
                  ? "You have unsaved changes. Press Escape or Cancel again to discard them."
                  : !draft.trim()
                    ? "Add some text to save."
                    : ""}
              </span>
            </div>
          </form>
        ) : (
          <div className="grid min-w-0 gap-4">
            {/* In the body, not the header, where it would crowd out Close on a phone. */}
            {copied === "failed" && (
              <p aria-hidden="true" className="m-0 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-3 py-2 text-sm text-muted-foreground">
                Couldn’t copy. Select the text to copy it.
              </p>
            )}
            {unsent && (
              // Until it is sent, the model has only its own version.
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-3 py-2 text-sm text-muted-foreground">
                <span role="status">
                  {sendNowFailed
                    ? "Your edit wasn’t sent. It’s still attached; try again."
                    : pending.edits.get(viewId)?.restored
                      ? "The original goes with your next message."
                      : "Your edit goes with your next message."}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={chatRunning}
                  onClick={() => {
                    // Only this edit goes now; it stays pending (and its
                    // chip stays) until the send is delivered.
                    const edit = pending.edits.get(viewId);
                    if (!edit) return;
                    const message = editMessage(edit);
                    // Straight to the chat, not through a generated action,
                    // which would attach this pending edit a second time.
                    setSendNowFailed(false);
                    settleWhenDelivered(
                      store,
                      chat,
                      { text: message, ids: [viewId], revisions: [edit.revision] },
                      () => setSendNowFailed(true),
                    );
                    void chat?.getState().processMessage({ role: "user", content: message });
                  }}
                >
                  Send now
                </Button>
              </div>
            )}
          <div className="relative">
          {selection && (
            <Button
              size="sm"
              variant="outline"
              className="absolute z-10 shadow-[var(--hui-shadow-floating)]"
              // Never past the panel's right edge, whatever was selected.
              style={{ top: selection.top, left: `min(${selection.left}px, calc(100% - 8rem))` }}
              // Keep the selection while the button is pressed.
              onMouseDown={(event) => event.preventDefault()}
              // A touch outside the selection could clear it, and the button
              // with it, before the tap lands.
              onPointerDown={(event) => event.preventDefault()}
              onClick={askAboutSelection}
            >
              Ask about this
            </Button>
          )}
          <div
            ref={body}
            // Written text keeps a reading measure in a wide panel, as a
            // document would; code, charts and visuals use the full width.
            className={cn(
              "grid min-w-0 gap-4",
              source?.complete && source.language === undefined && "mx-auto w-full max-w-[70ch]",
            )}
          >
            {edited !== null ? (
              <Markdown>
                {source?.language !== undefined
                  ? `${fenceFor(edited, source.language).open}\n${edited}\n${fenceFor(edited).close}`
                  : edited}
              </Markdown>
            ) : (
              children
            )}
          </div>
          </div>
          </div>
        )}
      </InsideCardContext.Provider>
    </ArtifactPanel>
  );

  return (
    <>
      <ArtifactCard
        ref={card}
        // Two versions share a title, so their cards keep saying which is which.
        keepDescription={version.total > 1}
        title={title}
        description={note}
        status={status}
        isOpen={isOpen}
        onClick={() => {
          if (isOpen) return close();
          open();
          // A person opened it, so focus follows them to the panel, unless
          // another version has taken its place by then.
          requestAnimationFrame(() => {
            if (panel.current && !panel.current.hidden) panel.current.focus();
          });
        }}
      />
      {/* Mounted while closed, so a form's values or a visual's state
          survive closing and reopening; hidden takes it out of view and out
          of the accessibility tree. */}
      {target ? createPortal(content, target) : content}
    </>
  );
}
