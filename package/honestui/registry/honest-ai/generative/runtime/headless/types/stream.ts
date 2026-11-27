// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import { AGUIEvent } from "@ag-ui/core";

export interface StreamProtocolAdapter {
  parse(response: Response): AsyncIterable<AGUIEvent>;
}

export { EventType } from "@ag-ui/core";
export type { AGUIEvent } from "@ag-ui/core";
