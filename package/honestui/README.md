# Honest UI

**Good interfaces. Honest code.**

Honest UI provides a CLI for copying editable interface components into your project, a registry API, and package entry points for larger visual collections. Copied code stays visible and under your control.

## Requirements

- Node.js 20.18.1 or later
- React 19 for React exports

The package is published as ES modules with TypeScript declarations.

## Add editable components

Run the CLI from an existing React project:

```bash
npx honestui@latest init
npx honestui@latest add button
```

The CLI writes the selected component source into your project. Use `--dry-run` to preview an add operation when the project already has a `components.json` file.

## Import package collections

Install the package when you use charts, icons, logos, vectors, or shaders:

```bash
npm install honestui
```

```tsx
import { BarChart, type ChartConfig } from "honestui/charts"
import "honestui/charts.css"

import { Search } from "honestui/icons"
import { Vercel } from "honestui/logos"
import { Abstract1Shapes } from "honestui/vectors"

import { LightRays } from "honestui/shaders"
```

Load `honestui/charts.css` once in your application root when you use charts. Shaders use Tailwind utilities and do not require a separate stylesheet.

## Registry API

The root entry point exposes registry functions for tooling:

```ts
import { getRegistry, getRegistryItems } from "honestui"
```

Registry authentication headers are scoped to each request. They are not stored in process-global state.

## Documentation

Read the full documentation at [honestui.com/docs](https://honestui.com/docs).

Honest UI is available under the MIT license.
