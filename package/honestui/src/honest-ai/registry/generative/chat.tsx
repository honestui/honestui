"use client";
import * as React from "react";
import { ChatThread, ChatMessage } from "../ai/chat-thread.js";
import { PromptBar } from "../ai/prompt-bar.js";
import { Markdown } from "../ai/markdown.js";
import { ToolChips } from "../ai/tool-chips.js";
import { LoadingState } from "../ai/loading-state.js";
import { Button } from "../../components/ui/button.js";
import {
  ChatProvider,
  useThread,
  useThreadList,
  useToolActivities,
  type ChatProviderProps,
  type AssistantMessage,
  type Message,
} from "./runtime/headless";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select.js";
import { ChevronRight as ChevronRightIcon } from "honestui/icons";
import {
  ChatBusyContext,
  ChatReplyContext,
  noteStopped,
  takeStopped,
  disclosureChevron,
  disclosureSummary,
  safeUrl,
} from "./renderers/shared";
import { ChatContext, useChatStore } from "./runtime/headless/store/ChatContext";
import { useDetailedViewPortalTarget } from "./runtime/headless/hooks/useDetailedViewPortalTarget";
import { DetailedViewContext } from "./runtime/headless/store/DetailedViewContext";
import {
  clearArtifactEdits,
  peekArtifactEdits,
  replyBegan,
  settleArtifactEdits,
  sweepExpiredEdits,
  usePendingArtifactEdits,
} from "./renderers/artifact";
import {
  X as RemoveIcon,
  Pencil as EditedIcon,
  TextQuote as QuoteIcon,
  Table2 as RowsIcon,
  Undo2 as RestoredIcon,
} from "honestui/icons";
import { cn } from "../../lib/utils.js";
import { Renderer, type RendererProps } from "./runtime/react";
import { honestChatLibrary } from "./index";
import { CONTEXT_KEY, UserMessageContent } from "./user-message";
import { chatMarkdownComponents } from "./task-list";
export { UserMessageContent } from "./user-message";
export { clearArtifactEdits } from "./renderers/artifact";
export * from "./runtime/headless";
export type GenerativeChatProps = Omit<ChatProviderProps, "children"> & {
  label?: string;
  rendererProps?: Omit<RendererProps, "response" | "isStreaming">;
  renderMessage?: (message: Message) => React.ReactNode;
  sidebar?: React.ReactNode;
  detailPanel?: React.ReactNode;
};
type ReplyPart = {
  kind: "markdown" | "block";
  text: string;
  /** False for a block whose closing fence has not arrived. */
  closed: boolean;
};

const BLOCK_OPENING = /^\s*(`{3,})\s*honestai(?:-lang)?\s*$/;
const FENCE_OPENING = /^\s*(`{3,}|~{3,})/;
// The start of a line that may still become a fence, such as "``" or "```hon".
const UNFINISHED_FENCE = /^\s*`+[\w-]*$/;

function closesFence(line: string, fence: string) {
  const marker = line.trim();
  return (
    marker.length >= fence.length && marker === fence[0].repeat(marker.length)
  );
}

/** Splits a reply into its Markdown and the `honestai` blocks fenced inside it. */
function splitReply(content: string, streaming: boolean): ReplyPart[] {
  // A stored message, or a reply that is only a program, has no Markdown around it.
  if (content.includes("]]>honestai:") || /^\s*[A-Za-z_]\w*\s*=/.test(content))
    return [{ kind: "block", text: content, closed: false }];

  const lines = content.split("\n");
  // Half a fence would flash as an empty code block, or reach the parser as a statement.
  if (streaming && UNFINISHED_FENCE.test(lines.at(-1) ?? "")) lines.pop();

  const parts: ReplyPart[] = [];
  let markdown: string[] = [];
  let program: string[] | null = null;
  let programFence = "";
  // Set inside an ordinary code block, where an `honestai` fence is sample text.
  let codeFence: string | null = null;
  const endMarkdown = () => {
    const text = markdown.join("\n");
    if (text.trim()) parts.push({ kind: "markdown", text, closed: true });
    markdown = [];
  };

  for (const line of lines) {
    if (program) {
      if (closesFence(line, programFence)) {
        parts.push({ kind: "block", text: program.join("\n"), closed: true });
        program = null;
      } else program.push(line);
    } else if (codeFence) {
      markdown.push(line);
      if (closesFence(line, codeFence)) codeFence = null;
    } else {
      const opening = BLOCK_OPENING.exec(line);
      if (opening) {
        endMarkdown();
        program = [];
        programFence = opening[1];
      } else {
        codeFence = FENCE_OPENING.exec(line)?.[1] ?? null;
        markdown.push(line);
      }
    }
  }
  if (program)
    parts.push({ kind: "block", text: program.join("\n"), closed: false });
  else endMarkdown();
  return parts;
}

/**
 * The reply's Markdown without its `honestai` programs: what a reader copies.
 * A reply that is only a program has no text to copy.
 */
export function replyText(content: string): string {
  return splitReply(content, false)
    .filter((part) => part.kind === "markdown")
    .map((part) => part.text.trim())
    .join("\n\n");
}

/** One generated block of a reply, with the errors from rendering it. */
function GeneratedBlock({
  program,
  streaming,
  rendererProps,
}: {
  program: string;
  streaming: boolean;
  rendererProps?: GenerativeChatProps["rendererProps"];
}) {
  const thread = useThread();
  const chatStore = useChatStore();
  const detailedViews = React.useContext(DetailedViewContext);
  const [errors, setErrors] = React.useState<string[]>([]);
  // A follow-up from this block that got no reply says so here, where the
  // reader pressed it, since the composer it did not come from stays empty.
  // It holds the thread length at that moment and hides once the
  // conversation moves on.
  const [noReplyAt, setNoReplyAt] = React.useState<number | null>(null);
  const busy = React.useSyncExternalStore(
    (listener) => chatStore.subscribe(listener),
    () => chatStore.getState().isRunning,
    () => false,
  );
  const length = React.useSyncExternalStore(
    (listener) => chatStore.subscribe(listener),
    () => chatStore.getState().messages.length,
    () => 0,
  );
  const noReply = noReplyAt !== null && noReplyAt === length;
  return (
    <ChatReplyContext.Provider value>
    <ChatBusyContext.Provider value={busy}>
      <Renderer
        {...rendererProps}
        library={rendererProps?.library ?? honestChatLibrary}
        response={program}
        isStreaming={streaming}
        onAction={(event) => {
          if (rendererProps?.onAction) rendererProps.onAction(event);
          else if (event.type === "continue_conversation") {
            // Another reply is running, so this message could not start.
            if (chatStore.getState().isRunning) return;
            // @ToAssistant's context travels with the form state, under a key
            // no form or $variable can have, so the model receives it too.
            const payload = {
              ...event.formState,
              ...(event.params.context !== undefined
                ? { [CONTEXT_KEY]: event.params.context }
                : {}),
            };
            // A generated follow-up (a follow-up chip, Ask about rows) carries
            // the reader's saved artifact edits like a typed message does,
            // before the form payload, which stays on the last line.
            const edits = peekArtifactEdits(detailedViews, chatStore.getState().selectedThreadId);
            const before = chatStore.getState().messages;
            const sentAt = before.length;
            const threadAtSend = chatStore.getState().selectedThreadId;
            void thread
              .processMessage({
                role: "user",
                content:
                  event.humanFriendlyMessage +
                  edits.text +
                  (Object.keys(payload).length > 0 ? "\n" + JSON.stringify(payload) : ""),
              })
              .then(() => {
                // The composer's rule: a reply that began settles the edits;
                // no reply (failed, stopped or empty) leaves the thread, so the
                // reader can press the same control again without a duplicate.
                const state = chatStore.getState();
                const stopped = takeStopped(chatStore);
                // If another conversation is showing now, leave it alone.
                if (threadAtSend !== null && state.selectedThreadId !== threadAtSend) return;
                if (replyBegan(state.messages.slice(sentAt))) {
                  settleArtifactEdits(detailedViews, edits);
                  setNoReplyAt(null);
                } else {
                  thread.setMessages(before);
                  // A failure shows its own alert, and Stop was the reader's choice.
                  setNoReplyAt(!state.threadError && !stopped ? before.length : null);
                }
              });
          }
          else if (event.type === "open_url") {
            const url = safeUrl(event.params.url);
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else
              setErrors([
                "The generated link is not a valid HTTP or HTTPS URL.",
              ]);
          } else
            setErrors([
              `No handler is configured for the ${event.type} action.`,
            ]);
        }}
        onError={(next) => {
          setErrors([
            // One message each, and only for what is missing from view: a
            // warning or a recovered value still renders.
            ...new Set(
              next
                .filter(
                  (error) => error.severity !== "warning" && !error.recovered,
                )
                .map((error) => error.message),
            ),
          ]);
          rendererProps?.onError?.(next);
        }}
      />
      {noReply && (
        <p role="status" className="m-0 text-sm text-muted-foreground">
          No reply came back. Try that again.
        </p>
      )}
      {errors.length > 0 && (
        // A reader needs to know something is missing, not the parser's
        // wording; that stays one click away for whoever is debugging.
        <div
          role="status"
          data-slot="generated-block-error"
          className="grid gap-1 text-sm text-muted-foreground"
        >
          <p className="m-0">Part of this reply couldn’t be displayed.</p>
          <details className="group">
            <summary className={disclosureSummary}>
              <ChevronRightIcon aria-hidden="true" className={disclosureChevron} />
              Details
            </summary>
            <p className="m-0 mt-1 max-h-40 overflow-y-auto font-mono text-xs [overflow-wrap:anywhere]">
              {errors.join(" ")}
            </p>
          </details>
        </div>
      )}
    </ChatBusyContext.Provider>
    </ChatReplyContext.Provider>
  );
}

/**
 * Where an open Artifact's panel renders. Place it beside the conversation;
 * it takes no space while no artifact is showing.
 */
export function ArtifactPortalTarget({ className }: { className?: string }) {
  const { setNode } = useDetailedViewPortalTarget();
  return (
    <div
      ref={setNode}
      data-slot="artifact-target"
      // Closed panels stay mounted (hidden) to keep their state, so the
      // target hides itself until one of them is showing.
      className={cn("[&:not(:has(>:not([hidden])))]:hidden [&>*]:min-h-0 [&>*]:flex-1", className)}
    />
  );
}

/**
 * Keeps this browser's saved artifact edits in step with the conversations:
 * removes a conversation's edits once it is deleted, and expired edits when
 * the chat opens. Used by GenerativeChat and the playground; call it once
 * inside a ChatProvider.
 */
export function useArtifactEditCleanup() {
  const { threads } = useThreadList();
  // A delete marks its conversation pending, then drops it once storage
  // confirms. Only that sequence counts: a conversation that merely falls
  // off a refreshed, paginated list still exists and keeps its edits.
  const deleting = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    sweepExpiredEdits();
  }, []);
  React.useEffect(() => {
    const ids = new Set(threads.map((thread) => thread.id));
    for (const id of deleting.current) if (!ids.has(id)) clearArtifactEdits(id);
    deleting.current = new Set(threads.filter((thread) => thread.isPending).map((thread) => thread.id));
  }, [threads]);
}

/**
 * Artifact edits the reader saved that will go with their next message,
 * shown by the composer so that context is never attached silently. Each can
 * be removed. Renders nothing when there are none.
 */
export function PendingArtifactEdits({ className }: { className?: string }) {
  const store = React.useContext(DetailedViewContext);
  const chat = React.useContext(ChatContext);
  // Only this conversation's attachments show, as only they would be sent.
  const thread = React.useSyncExternalStore(
    (listener) => chat?.subscribe(listener) ?? (() => {}),
    () => chat?.getState().selectedThreadId ?? null,
    () => null,
  );
  const { edits, remove } = usePendingArtifactEdits(store, thread);
  // What was just attached is said aloud, since the chip appears away from
  // where the reader acted. Written straight to the live region, so nothing
  // re-renders for it.
  const announcer = React.useRef<HTMLSpanElement>(null);
  const known = React.useRef<Set<string> | null>(null);
  const seenThread = React.useRef(thread);
  // A new revision of the same attachment (an edit saved again) is news too.
  const ids = edits.map((edit) => `${edit.viewId}@${edit.revision}`).join("\u0000");
  React.useEffect(() => {
    const current = new Set(ids ? ids.split("\u0000") : []);
    // Coming back to a conversation, its attachments are already known:
    // they are shown, not announced as new.
    const switched = seenThread.current !== thread;
    seenThread.current = thread;
    const added =
      known.current && !switched
        ? edits.filter((edit) => !known.current!.has(`${edit.viewId}@${edit.revision}`))
        : [];
    known.current = current;
    const region = announcer.current;
    if (added.length === 0 || !region) return;
    // Cleared first, so the same words (an edit saved again) are heard again.
    region.textContent = "";
    const frame = requestAnimationFrame(() => {
      region.textContent = `Attached to your next message: ${added.map(attachmentName).join(", ")}`;
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, thread]);
  const status = <span ref={announcer} role="status" className="sr-only" />;
  if (edits.length === 0) return status;
  return (
    <>
    {status}
    <ul aria-label="Attached to your next message" className={cn("m-0 flex list-none flex-wrap gap-2 p-0", className)}>
      {edits.map((edit) => (
        <li
          key={edit.viewId}
          className="flex max-w-full items-center gap-1.5 rounded-full border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] py-0.5 ps-2.5 pe-1 text-xs text-muted-foreground"
        >
          {/* Each kind of attachment shows what it is at a glance. */}
          {React.createElement(
            edit.kind === "rows"
              ? RowsIcon
              : edit.kind === "quote"
                ? QuoteIcon
                : edit.kind === "restored"
                  ? RestoredIcon
                  : EditedIcon,
            { "aria-hidden": true, className: "size-3 shrink-0" },
          )}
          <span className="truncate">
            {/* Two quotes from one artifact are told apart by what they say. */}
            {attachmentName(edit)}
          </span>
          <button
            type="button"
            aria-label={
              edit.kind === "rows"
                ? `Don’t send ${attachmentName(edit)}`
                : edit.kind === "quote"
                ? `Don’t send the quote “${edit.passage}” from ${edit.title}`
                : `Don’t send your edit to ${edit.title}`
            }
            title="Don’t send"
            onClick={() => remove(edit.viewId)}
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"
          >
            <RemoveIcon aria-hidden="true" className="size-3" />
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}

/** How an attachment is named, in its chip and when it is announced. */
function attachmentName(edit: { kind: string; title: string; passage?: string; names?: string }) {
  if (edit.kind === "rows")
    return `${edit.passage} ${edit.passage === "1" ? "row" : "rows"} from ${edit.title || "the table"}${
      edit.names ? `: ${edit.names}` : ""
    }`;
  const lead = edit.kind === "quote" ? "Quote from" : edit.kind === "restored" ? "The original of" : "Your edit to";
  return `${lead} ${edit.title}${edit.passage ? `: “${edit.passage}”` : ""}`;
}

/**
 * One assistant message: Markdown, with generated UI wherever the reply fences
 * an `honestai` block, and its tool activity.
 */
export function AssistantResponse({
  message,
  messages,
  streaming,
  rendererProps,
}: {
  message: AssistantMessage;
  messages: Message[];
  streaming: boolean;
  rendererProps?: GenerativeChatProps["rendererProps"];
}) {
  const activities = useToolActivities(message, messages);
  const content = typeof message.content === "string" ? message.content : "";
  const parts = splitReply(content, streaming);
  return (
    // The single minmax(0, 1fr) track lets wide content, such as a table, scroll instead of widening the message.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {parts.map((part, index) => {
        const arriving = streaming && index === parts.length - 1;
        // Parts only ever grow at the end, so the index keeps a block's state.
        return part.kind === "block" ? (
          <GeneratedBlock
            key={index}
            program={part.text}
            streaming={arriving && !part.closed}
            rendererProps={rendererProps}
          />
        ) : (
          <Markdown key={index} isStreaming={arriving} components={chatMarkdownComponents}>
            {part.text}
          </Markdown>
        );
      })}
      {activities.length > 0 && (
        <ToolChips
          summary="Tool activity"
          calls={activities.map((activity) => ({
            id: activity.id,
            label: activity.toolName,
            status:
              activity.status === "error"
                ? "error"
                : activity.status === "complete"
                  ? "done"
                  : "running",
            output: activity.result ? [{ text: activity.result }] : undefined,
          }))}
        />
      )}
    </div>
  );
}
function Conversation({
  label = "Conversation",
  rendererProps,
  renderMessage,
  sidebar,
  detailPanel,
}: Pick<
  GenerativeChatProps,
  "label" | "rendererProps" | "renderMessage" | "sidebar" | "detailPanel"
>) {
  const thread = useThread();
  const threads = useThreadList();
  const store = useChatStore();
  const detailedViews = React.useContext(DetailedViewContext);
  useArtifactEditCleanup();
  // An empty answer's notice holds the thread length then, and hides once
  // the conversation moves on (another send, or a follow-up that got a reply).
  const [noReplyAt, setNoReplyAt] = React.useState<number | null>(null);
  const noReply = noReplyAt !== null && noReplyAt === thread.messages.length;
  const [prompt, setPrompt] = React.useState("");
  const lastAssistant = thread.messages.findLast(
    (message) => message.role === "assistant",
  )?.id;
  return (
    <div className="@container flex h-full min-h-0 min-w-0 gap-4">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={thread.isRunning}
            onClick={threads.switchToNewThread}
          >
            New conversation
          </Button>
          <Select
            items={Object.fromEntries([
              ["", "New conversation"],
              ...threads.threads.map((item) => [item.id, item.title]),
            ])}
            value={threads.selectedThreadId ?? ""}
            disabled={thread.isRunning || threads.isLoadingThreads}
            onValueChange={(value) => {
              if (value) threads.selectThread(value);
              else threads.switchToNewThread();
            }}
          >
            <SelectTrigger aria-label="Conversation history" className="w-56 min-w-0 max-w-full">
              <SelectValue placeholder="New conversation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">New conversation</SelectItem>
              {threads.threads.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {threads.hasMoreThreads && (
            <Button variant="ghost" onClick={threads.loadMoreThreads}>
              Load more conversations
            </Button>
          )}
        </div>
        {threads.threadListError && (
          <div role="alert">
            <p>Conversation history could not be loaded.</p>
            <Button variant="secondary" onClick={threads.loadThreads}>
              Retry history
            </Button>
          </div>
        )}
        <ChatThread
          label={label}
          className="min-h-96"
          emptyMessage={
            thread.isLoadingMessages
              ? "Loading messages…"
              : "Send a message to start."
          }
          footer={
            <div className="grid gap-2">
            <PendingArtifactEdits />
            <PromptBar
              value={prompt}
              onValueChange={setPrompt}
              disabled={thread.isRunning || thread.isLoadingMessages}
              onStop={
                thread.isRunning
                  ? () => {
                      noteStopped(store);
                      thread.cancelMessage();
                    }
                  : undefined
              }
              onSubmit={({ text }) => {
                // Edits the reader saved in an artifact go with this message,
                // and stay pending until it is delivered.
                const edits = peekArtifactEdits(detailedViews, store.getState().selectedThreadId);
                const before = store.getState().messages;
                const threadAtSend = store.getState().selectedThreadId;
                void thread
                  .processMessage({ role: "user", content: text + edits.text })
                  .then(() => {
                    const state = store.getState();
                    // Text, a tool call or a tool's result: the model got it.
                    const reached = replyBegan(state.messages.slice(before.length));
                    // If another conversation is showing now, leave it alone.
                    if (threadAtSend !== null && state.selectedThreadId !== threadAtSend) return;
                    if (reached) settleArtifactEdits(detailedViews, edits);
                    // Stop is the reader's choice, recorded per chat, so it isn't reported.
                    const wasStopped = takeStopped(store);
                    // A turn with no reply (failed, stopped, or an empty
                    // answer) leaves the thread; the composer holds it for the
                    // retry. A partial reply stays.
                    if (!reached) thread.setMessages(before);
                    setNoReplyAt(
                      !reached && !state.threadError && !wasStopped ? before.length : null,
                    );
                    setPrompt(!reached ? text : "");
                  });
              }}
            />
            </div>
          }
        >
          {thread.messages
            .filter(
              (message) =>
                message.role === "user" || message.role === "assistant",
            )
            .map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role === "user" ? "user" : "assistant"}
                author={message.role === "user" ? "You" : "Assistant"}
                hideAuthor
              >
                {renderMessage ? (
                  renderMessage(message)
                ) : message.role === "assistant" ? (
                  <AssistantResponse
                    message={message}
                    messages={thread.messages}
                    streaming={thread.isRunning && message.id === lastAssistant}
                    rendererProps={rendererProps}
                  />
                ) : (
                  <UserMessageContent content={typeof message.content === "string" ? message.content : ""} />
                )}
              </ChatMessage>
            ))}
        </ChatThread>
        {thread.isRunning && <LoadingState label="Generating response" />}
        {noReply && (
          <p role="status" className="text-sm text-muted-foreground">
            No reply came back. Your message is in the box below; try sending it again.
          </p>
        )}
        {thread.threadError && (
          <p role="alert" className="text-sm text-destructive">
            The response failed.{prompt.trim() ? " Your message is in the box below; try sending it again." : ""}
          </p>
        )}
      </div>
      {/* Narrow, the panel covers the chat (a modal); wide, it sits beside it. */}
      {detailPanel ?? (
        <ArtifactPortalTarget className="fixed inset-0 z-50 flex bg-[var(--hui-color-background-base-primary)] p-3 @3xl:static @3xl:z-auto @3xl:w-[min(40rem,45%)] @3xl:shrink-0 @3xl:bg-transparent @3xl:p-0" />
      )}
    </div>
  );
}
/** HonestAI transport and state with Honest AI's conversation and composer. */
export function GenerativeChat({
  llm,
  storage,
  artifactRenderers,
  artifactCategories,
  artifactAutoOpen,
  ...props
}: GenerativeChatProps) {
  return (
    <ChatProvider
      llm={llm}
      storage={storage}
      artifactRenderers={artifactRenderers}
      artifactCategories={artifactCategories}
      artifactAutoOpen={artifactAutoOpen}
    >
      <Conversation {...props} />
    </ChatProvider>
  );
}
