# Honest UI

Accessible, source-first React components, charts, and icons.

[Documentation](https://honestui.com/docs) ·
[Report a bug](https://github.com/honestui/honestui/issues/new?template=bug_report.yml) ·
[Request a feature](https://github.com/honestui/honestui/issues/new?template=feature_request.yml)

Honest UI gives you polished building blocks that you can inspect, customize,
and own. Use the package entry points directly or copy components from the
registry into your application.

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

You need Node.js 20.18.1 or newer and npm.

```bash
npm install
npm run dev
```

Build and validate the projects with:

```bash
npm run build
npm run build:package
npm --prefix package/honestui run typecheck
```

`npm pack` and `npm publish` automatically run the package build through the
`prepack` script.

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please
follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report vulnerabilities
according to the [Security Policy](SECURITY.md).

## License

Honest UI is available under the [MIT License](LICENSE).
