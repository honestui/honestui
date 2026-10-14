// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import { createParser } from "../../core/index";

import { fixGeneration } from "./fix";
import { createAutofixStream } from "./stream";
import type {
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  StreamAdapter,
} from "./types";
import { AutofixError } from "./types";

/** Create helpers to validate and repair complete or streamed model output. */
export function createAutofix<Chunk>(
  options: AutofixOptions,
  adapter: StreamAdapter<Chunk>,
): {
  fix(input: AutofixInput): Promise<AutofixResult>;
  stream(input: AutofixStreamInput<Chunk>): AutofixStream<Chunk>;
} {
  const { library } = options;
  if (!library?.schema)
    throw new AutofixError("A library spec with schema is required", "invalid_library");
  const parser = createParser(library.schema, library.root);
  const maxAttempts = options.maxAttempts ?? 2;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3)
    throw new AutofixError("maxAttempts must be an integer from 1 to 3", "invalid_options");
  const fix = fixGeneration.bind(null, { ...options, parser, maxAttempts });

  return {
    fix,
    // Wrap model emissions with validation and repair before the stream finishes.
    stream: (input: AutofixStreamInput<Chunk>) => createAutofixStream(input, fix, adapter),
  };
}
