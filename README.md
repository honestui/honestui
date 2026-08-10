# Honest UI

**Good interfaces. Honest code.**

Honest UI gives you thoughtful components, charts, icons, and visual effects that you can adapt to your product. Interface components are copied into your project so the code stays visible and editable. Larger visual collections use explicit package entry points.

[Documentation](https://honestui.com/docs) · [Report a bug](https://github.com/honestui/honestui/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/honestui/honestui/issues/new?template=feature_request.yml)

## Add an interface component

From an existing React project:

```bash
npx honestui@latest init
npx honestui@latest add button
```

The CLI copies the selected source into your project. You can edit, rename, or remove it like any other application code.

## Use a package collection

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
import "honestui/shaders.css"
```

The package provides these ES module entry points with TypeScript declarations:

- `honestui` for the registry API and CLI runtime
- `honestui/charts` and `honestui/charts.css`
- `honestui/icons`
- `honestui/logos`
- `honestui/vectors`
- `honestui/shaders` and `honestui/shaders.css`

## What we live by

- Good defaults, without giving up control.
- Clear code over clever abstractions.
- Useful design over unnecessary decoration.
- Accessibility from the start.
- No lock-in. You own the code.
- Quality over hype.

## Development

You need Node.js 20.18.1 or newer and npm.

```bash
npm install
npm run dev
```

Verify the package release surface with:

```bash
npm --prefix package/honestui run verify:release
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report vulnerabilities through the [Security Policy](SECURITY.md).

Honest UI is available under the [MIT License](LICENSE).
