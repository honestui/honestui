# Honest AI Generative UI

Honest AI Generative UI is maintained as local React source.
The site and installed bundles use the extracted source here; they do not
import from the original monorepo or depend on published upstream packages.
Renderer internals use `useHonestAIState` and `HonestAIContext`;
message markers use `]]>honestai:` and code fences use `honestai`. Old upstream
markers are intentionally replaced, so stored responses using them need conversion.
Upstream snapshot: `066a1f535012413587ecfe4bc5fdbf9ad19ef990`.

See `LICENSE` for the retained Thesys copyright and MIT notice.

## Source ownership

- `runtime/core`: language parser, expressions, schemas, prompts, reactive state,
  query/mutation execution, stored-message protocol, and validation.
- `runtime/react`: component definitions, streaming renderer, forms, and hooks.
- `runtime/headless`: chat/thread/artifact state, storage and transport adapters.
- `runtime/server`: provider-specific validation and application-supplied repair.
- `runtime/observability`: local event bus, with no automatic remote sink.
- `catalog`: Honest AI component contracts, backed by Honest renderers.
- `renderers`: adapters to Honest AI, Honest UI, and the missing chart types.
- `chat.tsx`: Honest AI Chat Thread, Prompt Bar, and Tool Chips wired to the
  headless provider. A reply is Honest AI Markdown; its fenced `honestai` blocks
  render with the chat library, whose `Stack` root adds no frame.
- `spec.json` / `chat-spec.json`: generated server-safe library specs.

Primitive UI implementations are reused from `components/ui`. Editable tables
and date ranges reuse Honest UI's Data Grid and Date Range Picker under
`components/product`. Standard charts use `honestui/charts`. Radar and polar
bar charts are additions, with accessible data-table alternatives.

The port removes install/runtime telemetry and automatic devtools registration.
It fixes conditional hook calls in the headless selectors and retains complete
local conversation history while the provider is mounted. Custom storage and
model endpoints remain application responsibilities.

## Verification and updates

- `npm run test:generative`: local runtime regressions plus adapter tests.
- `npm run test:e2e -- tests/e2e/generative.spec.ts`: integrated browser flows.
- `npm run generative:spec`: regenerate the JSON specs after contract changes.
- `npm run generative:standalone`: reject upstream imports, names, and service defaults.
- `npm run generative:check`: detect drift between server and client specs.
- `npm run verify:site`: lint, types, docs, styles, and production build.

Imported regression tests live beside their runtime source and are excluded
from installable bundles. Update copied runtime code deliberately and rerun the
regressions and browser flows. Keep model credentials and authorization on the
server; neither generated component schemas nor client actions grant access.

`HtmlVisual` is the only component that runs model-written code: nested iframes with `sandbox="allow-scripts"` (no same-origin, forms, popups, top navigation or downloads), a `default-src 'none'` policy, and an outer `frame-src 'none'` that stops the visual navigating itself, so it has no access to the page, no fetch, image, socket or other policy-governed network access, and cannot become another site. WebRTC cannot be blocked by page policy, and the frames inherit the host page's CSP (a strict nonce `script-src` stops visuals). It renders only once its block has finished streaming. `Artifact` opens its content in the panel registered with `ArtifactPortalTarget`, through a portal, so the content keeps its reply's state. A reader's saved edit to a written artifact is kept in the browser's `localStorage` (keys starting `honest-ai:artifact-edit:`, per conversation and artifact) and goes with their next message until the assistant has it; `PendingArtifactEdits` shows it by the composer. Saved edits expire after 30 days and are swept when the chat opens; `useArtifactEditCleanup()` (used by `GenerativeChat`) removes a conversation's edits once it is deleted. Call `clearArtifactEdits()` on sign-out. A failed or stopped turn is removed from the client's thread; with server-backed storage, check that your backend does not keep a user message whose send failed.

Autofix parses locally and optionally calls your supplied repair function. All candidates are revalidated with the local library. Storage requires an application API URL; no vendor service is selected by default. Script execution uses an application-supplied sandbox callback. Keep the retained MIT copyright notice with redistributed source.
