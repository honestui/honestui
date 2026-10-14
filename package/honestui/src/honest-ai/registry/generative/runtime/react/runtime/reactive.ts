// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
// ─────────────────────────────────────────────────────────────────────────────
// Reactive schema marker for honestai-lang (React adapter)
// ─────────────────────────────────────────────────────────────────────────────

import type { StateField } from "../../core/index";
import { markReactive } from "../../core/index";
import type { z } from "zod/v4";

// Re-export for internal use
export { isReactiveSchema } from "../../core/index";

/**
 * Mark a schema prop as reactive so runtime evaluation can preserve $bindings.
 *
 * The widened return type carries the eventual value shape into helpers like
 * `useStateField()`. The actual bound value is still resolved at render time.
 */
export function reactive<T extends z.ZodType>(schema: T): z.ZodType<StateField<z.infer<T>>> {
  markReactive(schema);
  return schema as unknown as z.ZodType<StateField<z.infer<T>>>;
}
