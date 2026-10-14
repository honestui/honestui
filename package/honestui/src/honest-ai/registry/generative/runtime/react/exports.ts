// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
// define library
export { action, defineAction, defineFunction, steps, tagSchemaId } from "../core/index";
export type { ActionRef, DefinedAction, DefinedFunction } from "../core/index";
export { createLibrary, defineComponent } from "./library";
export type {
  ComponentGroup,
  ComponentRenderProps,
  ComponentRenderer,
  DefinedComponent,
  Library,
  LibraryDefinition,
  LibraryExtension,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "./library";

// honestai-lang renderer
export { Renderer, useRendererQuery } from "./Renderer";
export type {
  RendererContentSlotProps,
  RendererProps,
  RendererQueryState,
  RendererRetryProps,
  RendererSlotProps,
} from "./Renderer";

// honestai-lang action types
export { ACTION_STEPS, BuiltinActionType } from "../core/index";
export type {
  ActionEvent,
  ActionPlan,
  ActionStep,
  ElementNode,
  LibraryActionEvent,
  HonestAIError,
  ParseResult,
} from "../core/index";

// honestai-lang parser (server-side use)
export { createParser, createStreamingParser } from "../core/index";

// Message protocol: marker lines around a stored response
export { buildMessage, parseMessage } from "../core/index";
export type { BuildMessageInput, ParseMessageOptions, ParsedMessage } from "../core/index";

// Standalone prompt generation (no Zod deps — usable on backend)
export { generatePrompt, generateSystemPrompt } from "../core/index";
export type {
  ComponentPromptSpec,
  PromptSpec,
  SystemPromptOptions,
  SystemPromptSpec,
  ToolSpec,
} from "../core/index";

// honestai-lang edit/merge
export { mergeStatements } from "../core/index";

// honestai-lang context hooks (for use inside component renderers)
export {
  FormNameContext,
  useFormName,
  useGetFieldValue,
  useIsQueryLoading,
  useIsStreaming,
  useRenderNode,
  useSetDefaultValue,
  useSetFieldValue,
  useTriggerAction,
} from "./context";

// Runtime — reactive bindings, store, evaluator, query manager, field binding
export { ToolNotFoundError, extractToolResult, isReactiveAssign } from "../core/index";
export type {
  EvaluationContext,
  McpClientLike,
  ReactiveAssign,
  StateField,
  ToolProvider,
} from "../core/index";
export { reactive } from "./runtime";

// Unified field state hook — component authors use this
export { useStateField } from "./hooks/useStateField";

// honestai-lang form validation
export {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "./hooks/useFormValidation";
export type { FormValidationContextValue } from "./hooks/useFormValidation";

export {
  builtInValidators,
  parseRules,
  parseStructuredRules,
  validate,
} from "../core/index";
export type { ParsedRule, ValidatorFn } from "../core/index";

export type { ResponseMetadata } from "./responseBundle";
export { WithPreviewRenderer, useRendererPreview } from "./WithPreviewRenderer";
export type {
  PreviewButtonProps,
  PreviewContentProps,
  RendererPreviewState,
  WithPreviewRendererProps,
} from "./WithPreviewRenderer";
