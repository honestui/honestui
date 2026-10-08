# Changelog

Changes to the public honestui package are recorded here. Version headings
follow semantic versioning and link to the corresponding GitHub release.

## Unreleased

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
