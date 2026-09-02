# Changelog

Changes to the public honestui package are recorded here. Version headings
follow semantic versioning and link to the corresponding GitHub release.

## Unreleased

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
