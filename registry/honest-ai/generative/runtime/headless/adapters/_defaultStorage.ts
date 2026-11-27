// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { Thread } from "../store/types";
import type { Message, UserMessage } from "../types/message";
import type { ChatStorage } from "./types";

/**
 * Internal default storage — in-memory, no persistence across reload.
 * Used by `<ChatProvider>` when no `storage` prop is provided. Not exported
 * from the package; callers who want explicit in-memory behavior should
 * construct their own adapter object.
 */
export function createDefaultInMemoryStorage(): ChatStorage & { rememberMessages: (threadId: string, messages: Message[]) => void } {
  let threads: Thread[] = [];
  const messagesByThread = new Map<string, Message[]>();

  return {
    rememberMessages(threadId, messages) {
      if (threads.some(thread => thread.id === threadId)) messagesByThread.set(threadId, [...messages]);
    },
    thread: {
      async listThreads() {
        return { threads };
      },
      async createThread(firstMessage: UserMessage) {
        const thread: Thread = {
          id: crypto.randomUUID(),
          title:
            typeof firstMessage.content === "string"
              ? firstMessage.content.slice(0, 40) || "New thread"
              : "New thread",
          createdAt: new Date().toISOString(),
        };
        threads = [thread, ...threads];
        messagesByThread.set(thread.id, [
          { ...firstMessage, id: firstMessage.id ?? crypto.randomUUID() },
        ]);
        return thread;
      },
      async getMessages(threadId: string) {
        return messagesByThread.get(threadId) ?? [];
      },
      async updateThread(thread: Thread) {
        threads = threads.map((t) => (t.id === thread.id ? thread : t));
        return thread;
      },
      async deleteThread(id: string) {
        threads = threads.filter((t) => t.id !== id);
        messagesByThread.delete(id);
      },
    },
  };
}
