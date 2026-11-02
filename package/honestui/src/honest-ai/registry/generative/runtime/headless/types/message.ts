// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type {
  InputContent as ProtocolInputContent,
  Message as ProtocolMessage,
  ToolMessage as ProtocolToolMessage,
  UserMessage as ProtocolUserMessage,
} from "@ag-ui/core";

export type {
  ActivityMessage,
  AssistantMessage,
  DeveloperMessage,
  FunctionCall,
  ReasoningMessage,
  SystemMessage,
  TextInputContent,
  ToolCall,
} from "@ag-ui/core";

// Preserve stored messages and the public binary-input API across AG-UI 1.0.
export interface BinaryInputContent {
  type: "binary";
  mimeType: string;
  id?: string;
  url?: string;
  data?: string;
  filename?: string;
}

export type InputContent = ProtocolInputContent | BinaryInputContent;
export type UserMessage = Omit<ProtocolUserMessage, "content"> & {
  content: string | InputContent[];
};

// Tool renderers and storage expose text results, as they did before AG-UI 1.0.
export type ToolMessage = Omit<ProtocolToolMessage, "content"> & { content: string };
export type Message = Exclude<ProtocolMessage, { role: "user" | "tool" }> | UserMessage | ToolMessage;
