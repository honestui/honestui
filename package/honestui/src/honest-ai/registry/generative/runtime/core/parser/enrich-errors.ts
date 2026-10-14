// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { LibraryJSONSchema, HonestAIError, ValidationError } from "./types";

/** Build a signature hint like "Header(title*, subtitle, icon)" from JSON schema. */
function buildSignatureHint(
  componentName: string,
  schema: { properties?: Record<string, unknown>; required?: string[] } | undefined,
): string | undefined {
  if (!schema?.properties) return undefined;
  const required = new Set(schema.required ?? []);
  const params = Object.keys(schema.properties)
    .map((k) => (required.has(k) ? `${k}*` : k))
    .join(", ");
  return `Signature: ${componentName}(${params}) — * marks required`;
}

/**
 * Convert parser ValidationErrors into enriched HonestAIErrors with hints.
 *
 * Framework-agnostic — usable by React, Svelte, Vue, or standalone.
 *
 * @deprecated ValidationError.message is already humanized and self-sufficient
 * (signatures, available components, expected types are inlined) — read
 * `result.meta.errors` directly. Will be removed in a future major release.
 */
export function enrichErrors(
  validationErrors: ValidationError[],
  schema: LibraryJSONSchema,
  componentNames: string[],
): HonestAIError[] {
  return validationErrors.map((ve) => {
    const error: HonestAIError = {
      source: "parser",
      code: ve.code,
      message: ve.message,
      component: ve.component,
      path: ve.path || undefined,
      statementId: ve.statementId,
      ...(ve.severity && { severity: ve.severity }),
      ...(ve.recovered && { recovered: ve.recovered }),
    };
    if (ve.code === "unknown-component" && componentNames.length) {
      error.hint = `Available components: ${componentNames.join(", ")}`;
    } else if (ve.code === "missing-required" || ve.code === "null-required") {
      error.hint = buildSignatureHint(ve.component, schema.$defs?.[ve.component]);
    } else if (ve.code === "inline-reserved") {
      error.hint = `Declare as a top-level statement: myVar = ${ve.component}(...)`;
    }
    return error;
  });
}
