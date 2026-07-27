# Honest UI

Accessible React components, charts, and icons in one package.

## Install

```bash
npm install honestui
```

## Use

```tsx
import { Button } from "honestui";
import { BarChart, type ChartConfig } from "honestui/charts";
import { Search } from "honestui/icons";
```

The Gooey Toast component also uses the package stylesheet:

```tsx
import "honestui/styles.css";
```

The three JavaScript entry points are:

- `honestui` for UI components
- `honestui/charts` for chart components, helpers, and types
- `honestui/icons` for the complete icon catalog and metadata

Both ES modules and CommonJS are published with TypeScript declarations.

## Development

```bash
npm run dev
npm run build:package
```

`npm pack` and `npm publish` automatically run the package build through the
`prepack` script.
