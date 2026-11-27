// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
/**
 * Standard error thrown when a tool name is not found in a function-map ToolProvider.
 * Used by Renderer's inline normalization to give clear error messages.
 */
export class ToolNotFoundError extends Error {
  readonly toolName: string;
  readonly availableTools: string[];

  constructor(toolName: string, availableTools: string[] = []) {
    super(
      `[honestai] No handler for tool "${toolName}". Available: ${availableTools.join(", ") || "(none)"}`,
    );
    this.name = "ToolNotFoundError";
    this.toolName = toolName;
    this.availableTools = availableTools;
  }
}
