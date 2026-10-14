export * from "./honest-ai/registry/generative/runtime/core/index.js"
export { createAutofix } from "./honest-ai/registry/generative/runtime/server/shared/create-autofix.js"
export * from "./honest-ai/registry/generative/runtime/server/shared/types.js"
import spec from "./honest-ai/registry/generative/spec.json"
import chatSpec from "./honest-ai/registry/generative/chat-spec.json"
import type { LibrarySpec, LibraryJSONSchema } from "./honest-ai/registry/generative/runtime/core/index.js"
export const honestSpec: LibrarySpec & { schema: LibraryJSONSchema } = spec
export const honestChatSpec: LibrarySpec & { schema: LibraryJSONSchema } = chatSpec
