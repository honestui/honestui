// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
/** Events shared by the local renderer and observability subscribers. */
export const STREAM_EVENT_KIND = "react-lang:stream" as const;
export type StreamEventKind = typeof STREAM_EVENT_KIND;

export const STREAM_PHASE_STREAMING = "streaming" as const;
export const STREAM_PHASE_SETTLED = "settled" as const;
export type StreamPhase = typeof STREAM_PHASE_STREAMING | typeof STREAM_PHASE_SETTLED;

export interface StreamParserMetadata {
  incomplete: boolean;
  unresolved: unknown;
  orphaned: unknown;
  statementCount: number;
}

/** Detail payload emitted when a stream settles. */
export interface SettledStreamEventDetail {
  id: string;
  kind: StreamEventKind;
  phase: typeof STREAM_PHASE_SETTLED;
  updateIndex: number;
  response: string | null;
  responseLength: number;
  parser?: StreamParserMetadata;
  errors: unknown[];
  errorCount: number;
  message: string;
  /** `createLibrary()` instance id for the Renderer that produced this stream. */
  __libraryId?: string;
}
