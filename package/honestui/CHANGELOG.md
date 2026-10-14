# Changelog

Changes to the `honestui` npm package. Entries marked unreleased describe work prepared for the next publication.

## 0.2.3

- Install AI components, prose, syntax, and generative UI by name: `honestui add prompt-bar`, `honestui add prose-syntax-react`, and `honestui add generative-chat`. The CLI ships the AI source and dependency metadata; core UI dependencies still come from the Honest UI registry. AI items also appear in first-party registry search.
- Import AI components from `honestui/ai` or `honestui/ai/<component-name>`. Add `honestui/prose` utilities and `honestui/prose.css`, syntax highlighting with React, browser, CodeMirror, and theme entry points, and the browser worker with lazy grammar chunks.
- Add `honestui/genui` for the renderer and standard catalog, `/react` for custom libraries, `/chat` for conversation state and the chat shell, and `/server` for parsing, prompts, specs, and validation. OpenAI, Vercel, and LangGraph server adapters have separate entry points. Apps supply model transports, repair callbacks, and map services.
- Include `honestui/ai.css` for compiled component utilities and `honestui/theme.css` for standalone theme tokens. Vite syntax consumers need `worker: { format: "es" }`. Generative schemas use Zod v4; existing CLI schemas keep Zod v3 behavior. Provider, editor, math, and Eve SDKs remain optional peers; optional math is verified with KaTeX 0.18.2.
- Build copied items and package exports from the same Honest AI source snapshot. Add source sync, snapshot checks, packed-install TypeScript checks, browser flow verification, and import-boundary checks. Retain the source licenses.

## 0.2.2 - 2026-10-13

This release changes how several components look. The CLI and the package's `charts`, `icons`, `logos`, `shaders`, and `vectors` exports are the same as in 0.2.1; the changes below reach a project in three ways:

- **Components** come from the registry at honestui.com. `honestui add` installs the new versions once the site is deployed. Components already copied into a project are unchanged until they are added again.
- **Theme tokens and base styles** live in a project's own `styles/` folder, which `honestui create` copies from the starter templates. New projects get them. An existing project keeps its current files; to adopt the token changes marked "theme stylesheet" below, copy `colors.css`, `effects.css`, and `typography.css` from a current starter template.
- **The `init` theme variables** are served by honestui.com and apply the next time `init` runs.

`init` (served by the site):

- Fix dark theme in newly initialized projects. `init` wrote fixed light values for `--background`, `--foreground`, and the other shadcn-style variables, so setting `data-theme="dark"` left the page background and text light while components switched. These variables now resolve through the Honest UI color tokens and follow `data-theme`. The values use relative color syntax, which needs Chrome 119, Safari 16.4, or Firefox 128.

Theme stylesheet (new projects, or existing projects that copy the updated files):

- Make `--hui-focus-ring` and `--hui-focus-ring-shadow` 2px, up from 1px.
- Raise red text contrast: `--hui-color-foreground-danger-primary` now maps to step 11 of the danger scale and its hover token to step 12, so error text and `destructive-outline` labels meet 4.5:1.
- Stop the global heading sizes from overriding component titles. The `h1` to `h4` size, weight, and line-height defaults now skip elements with a `data-slot`, so `DialogTitle`, `PopoverTitle`, and `AlertDialogTitle` render at their own 16px instead of the 28px `h2` default, and `SheetTitle` inherits its size from the sheet.
- Add `--hui-shadow-key`, and the control text tokens `--hui-font-size-control` (13px), `--hui-line-height-control`, and `--hui-letter-spacing-control`. Components fall back to fixed values when a project's stylesheet does not define them.

Components (registry):

- Use one keyboard focus ring everywhere. `Accordion`, `Sheet`, `ScrollArea`, `Combobox`, `InputGroup`, and `ContextMenu` use the token ring in place of their own; the `ContextMenu` trigger previously referenced an undefined color. `Input`, `Textarea`, `FieldControl`, `NumberField`, and `Select` show the ring around their border, and `InputGroup` no longer shows a second ring on its inner control.
- Use one selected color. `Radio` and `Switch` are rebuilt on the Honest UI tokens and use the accent color when checked, matching `Checkbox`; they previously used the neutral emphasis color.
- Change `Button` variants. `outline` has a neutral border and primary text in place of the accent border and accent text. `ghost` has a solid hairline border in place of a dashed one. Filled variants use the new `--hui-shadow-key` bottom edge. The `destructive` fill is 10% darker so its white label reaches a 4.5:1 contrast ratio.
- Show disabled controls as flat and gray instead of 50% transparent: `Button`, `Input`, `Textarea`, `FieldControl`, `NumberField`, `Select`, `Checkbox`, `Radio`, and `Switch`, plus items in `Menu`, `ContextMenu`, `DropdownMenu`, `Command`, `Select`, `Combobox`, and `Autocomplete`, and `Tabs`, `Accordion`, `Toggle`, and `Breadcrumb` triggers. Disabled `Checkbox` and `Radio` keep a visible border.
- Move the remaining components onto the Honest UI tokens: `Card`, `DropdownMenu`, `Sheet`, `Accordion`, `Frame`, `Autocomplete`, `Combobox`, `InputGroup`, `Empty`, `ScrollArea`, and `Alert`. `Card` and these surfaces use the control radius (`--hui-radius-2`). `Alert` variants `info`, `success`, `warning`, and `error` now use the accent, success, attention, and danger tokens; they previously referenced color names that were not defined.
- Set control text to 13px, up from 12px, in `Button`, `Input`, `Textarea`, `FieldControl`, `NumberField`, `Select`, `Menu`, `ContextMenu`, `Command`, and `Combobox`. `FieldLabel` is 13px medium, `Label` is 13px, and `FieldDescription` and `FieldError` are 12px, up from 11px.
- Raise gray text contrast. `Table` header cells, `Breadcrumb` links, and `Command` group labels and trailing text use the secondary foreground color in place of the tertiary one. `KanbanList` note text is darker in the light theme.
- Fix `NumberField` sizes: `sm` is 20px and `lg` is 32px. Both previously rendered at the 24px default.
- Fix `Skeleton`, which was nearly invisible because its fill matched the page background.
- Mark the current page in `Pagination` with a filled button. `PaginationPrevious` and `PaginationNext` match the page buttons' size on narrow screens.
- Let `BreadcrumbList` wrap, and let `Toolbar` scroll horizontally when its container is too narrow.
- Give `Empty` a dashed border by default.
- Strengthen the unchecked border on `Checkbox` and `Radio`, and use the `--hui-shadow-key` edge on the active `Tabs` indicator and the `Switch` thumb.

## 0.2.1 - 2026-10-12

- Update dependencies to address the package audit findings, and use patched Vitest 4 with Vite 6 to retain Node 20.18.1 support in package verification.
- Replace fast-glob with tinyglobby for file discovery. Preserve directory names, search depth, hidden-file handling, and ignored directories. Migration globs no longer support zero-padded brace ranges such as `{01..03}` or stepped ranges such as `{1..5..2}`.
- Add scoped density: `honestui/density.css` defines `compact`, `default`, and `comfortable` levels as CSS variables on `[data-density]`, plus `density-compact:`, `density-default:`, and `density-comfortable:` Tailwind CSS v4 variants. `DensityScope`, `DensityProvider`, and `useDensity` carry the level to portaled popups. `Button`, `Input`, `Select`, `Menu`, `Table`, `Toolbar`, `DataTable`, and `DataGrid` follow the nearest scope and are unchanged outside one. On coarse pointers every scope gives controls, menu items, and rows a 44px minimum height. `DataTable` accepts `density="comfortable"`, and `DataTable` and `DataGrid` inherit their density from a scope when the prop is unset.
- Add the Quantity Field product component: `QuantityField`, `QuantityFieldLabel`, `QuantityFieldControl`, and `QuantityFieldStatus` hold a duration or a data size as one number in one declared unit and show it in whichever unit is selected. Switching units converts the number on screen and leaves the stored value unchanged; when a unit cannot show the value within `rounding.maximumFractionDigits`, the field says the number is rounded and states the exact value. Pasted text such as `90 min`, `1h 30m`, or `1,024 MiB` is read with its unit. `min` and `max` are checked against the stored value. `durationUnits` and `storageUnits` are included.
- Add the Overflow Toolbar product component: `OverflowToolbar`, `OverflowToolbarGroup`, `OverflowToolbarItem`, and `OverflowToolbarMore` move lower-priority actions into a More menu when the toolbar's container is too narrow, and return them when it widens. Each action declares a `priority`, or `"always"` to stay visible. The toolbar measures its own box, so it follows sidebars and resized panels as well as the window. Groups and disabled states carry into the menu, and focus moves with an action that had it. `Toolbar` now accepts a `ref`.
- Add the Async Action product component: `useAsyncAction`, `ActionButton`, and `ActionStatus` run one request at a time, apply an optimistic update and roll it back on failure, ignore repeated clicks and late responses from cancelled runs, and keep Retry, Cancel, and Undo available in an inline status. Cancel and Undo are offered only when the application declares the request cancelable or passes a reversal.
- Add the Paste Table product component: paste cells from Excel or Google Sheets, map each pasted column to a field, and fix or remove invalid cells before importing. Number columns take a `decimalSeparator`, date columns require a `dateOrder`, and `parse` and `validate` callbacks add your own rules. Parsing and validation run in the browser, and `onImport` receives the valid rows.
- Add the Change Review product component: a before-and-after view of a structured object that states each change in words, summarizes list changes, nests fields under groups, hides unchanged fields on request, accepts custom value renderers, and collects an accept or reject decision per change when the application handles them.
- Add data status to every chart: name a row field with `statusKey` to mark values as measured, estimated, provisional, forecast, or missing, and add `lowerKey` and `upperKey` to show the bounds you supply. Each chart draws the status, lists it in a key, and explains it in the tooltip. `LineChart`, `AreaChart`, and `BarChart` take the props on the series part; `PieChart`, `ScatterChart`, and `Heatmap` take them on the root, and `ScatterChart` has separate bounds for each axis. `dataStatusText` replaces the default wording.
- Add the `dashboard` template: `honestui create -t dashboard` scaffolds the complete Northstar analytics dashboard from the `honestui/honestui-dashboard` template repository. Standalone templates ship fully configured, so init skips the base and preset prompts for them.

## 0.2.0 - 2026-09-01

- Move CLI project scaffolds into the public `honestui/honestui-starters` repository.
- Add complete Next.js, Vite, TanStack Start, React Router, Astro, and Laravel application starters, plus monorepo variants for every supported framework except Laravel.
- Include the full public component registry, HonestUI styles, and local font files in every starter.
- Add the DataGrid product component with virtualized rows, inline editing, filtering, and selection.
- Add the DataTable product component with search, filters, pagination, a toolbar, and view options.
- Add the DateRangePicker product component with a calendar, presets, and date limits.
- Add the File Upload product component with drag and drop, paste, validation, and image previews.
- Add the Filter Bar product component with text, number, and date range fields, async loading, and a DataTable integration.

## 0.0.9

- Own the icon, logo, and vector catalogs directly in the HonestUI package.
- Emit declaration files with TypeScript so the complete asset API builds reliably.
- Include the package changelog in published artifacts.
- Align React type dependencies with the package's public React 19 peer requirements.
- Add a verified GitHub Actions trusted-publishing release path.

## 0.0.7

- Previous public package release.
