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
import { safeUrl } from "./renderers/shared";
import { useChatStore } from "./runtime/headless/store/ChatContext";
import { Renderer, type RendererProps } from "./runtime/react";
import { honestChatLibrary } from "./index";
import { CONTEXT_KEY, UserMessageContent } from "./user-message";
export { UserMessageContent } from "./user-message";
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
  const [errors, setErrors] = React.useState<string[]>([]);
  return (
    <>
      <Renderer
        {...rendererProps}
        library={rendererProps?.library ?? honestChatLibrary}
        response={program}
        isStreaming={streaming}
        onAction={(event) => {
          if (rendererProps?.onAction) rendererProps.onAction(event);
          else if (event.type === "continue_conversation") {
            // @ToAssistant's context travels with the form state, under a key
            // no form or $variable can have, so the model receives it too.
            const payload = {
              ...event.formState,
              ...(event.params.context !== undefined
                ? { [CONTEXT_KEY]: event.params.context }
                : {}),
            };
            void thread.processMessage({
              role: "user",
              content:
                event.humanFriendlyMessage +
                (Object.keys(payload).length > 0 ? "\n" + JSON.stringify(payload) : ""),
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
      {errors.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          Part of the generated interface could not be shown:{" "}
          {errors.join(" ")}
        </p>
      )}
    </>
  );
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
          <Markdown key={index} isStreaming={arriving}>
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
  const canceled = React.useRef(false);
  const [prompt, setPrompt] = React.useState("");
  const lastAssistant = thread.messages.findLast(
    (message) => message.role === "assistant",
  )?.id;
  return (
    <div className="flex h-full min-h-0 min-w-0 gap-4">
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
            <PromptBar
              value={prompt}
              onValueChange={setPrompt}
              disabled={thread.isRunning || thread.isLoadingMessages}
              onStop={
                thread.isRunning
                  ? () => {
                      canceled.current = true;
                      thread.cancelMessage();
                    }
                  : undefined
              }
              onSubmit={({ text }) => {
                canceled.current = false;
                void thread
                  .processMessage({ role: "user", content: text })
                  .then(() => {
                    setPrompt(
                      store.getState().threadError || canceled.current
                        ? text
                        : "",
                    );
                  });
              }}
            />
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
        {thread.threadError && (
          <p role="alert" className="text-sm text-destructive">
            The response failed. Your message is saved. Try sending it again.
          </p>
        )}
      </div>
      {detailPanel}
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
