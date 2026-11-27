// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
export { BuiltinActionType } from "./types";
export type {
  ActionEvent,
  ElementNode,
  LibraryJSONSchema,
  MutationStatementInfo,
  HonestAIError,
  ParamDef,
  ParamMap,
  ParseResult,
  QueryStatementInfo,
  ValidationError,
  ValidationErrorCode,
} from "./types";

export { createParser, createStreamingParser, parse } from "./parser";
export type { Parser, StreamParser } from "./parser";

export { enrichErrors } from "./enrich-errors";

export { generatePrompt } from "./prompt";
export type { ComponentGroup, ComponentPromptSpec, PromptSpec, ToolSpec } from "./prompt";

export { mergeStatements } from "./merge";

export { jsonToHonestAI } from "./serialize";
export type { SerializeOptions } from "./serialize";

export { compileSchema } from "./parser";

// Shared builtin registry
export { BUILTINS, isBuiltin } from "./builtins";

// Typed statement model + AST utilities
export { isASTNode, isRuntimeExpr } from "./ast";
export type { ASTNode, CallNode, RuntimeExprNode, Statement } from "./ast";
