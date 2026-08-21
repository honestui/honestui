# Contributing to Honest UI

Thanks for helping improve Honest UI. Contributions of all sizes are welcome,
including bug fixes, documentation, examples, accessibility improvements, and
new components.

By participating in this project, you agree to follow our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Before you begin

- Search the existing issues before opening a new one.
- Open an issue before starting a large change or a new component so the
  approach can be discussed first.
- Never use a public issue to report a security vulnerability. Follow the
  instructions in [SECURITY.md](SECURITY.md) instead.

Small bug fixes and documentation improvements can go directly to a pull
request.

## Local development

You need Node.js 22.13.0 or newer and npm.

```bash
git clone https://github.com/honestui/honestui.git
cd honestui
npm install
npm run dev
```

The documentation site is available at `http://localhost:3000` by default.

The repository contains two related projects:

- The documentation site and component registry live at the repository root.
- The Honest UI CLI lives in `package/honestui` and has its own lockfile.

Install CLI dependencies separately when working on the CLI:

```bash
npm --prefix package/honestui install
```

## Making changes

1. Fork the repository and create a branch from `main`.
2. Keep each pull request focused on one problem.
3. Follow the patterns used by nearby components and documentation.
4. Add or update documentation when behavior or public APIs change.
5. Include screenshots or recordings for visible UI changes.

When changing a component, confirm that it works with keyboard navigation,
has an accessible name where needed, and handles disabled, error, and loading
states that apply to it.

## Checks

Run the checks relevant to your change before opening a pull request:

```bash
npx eslint path/to/changed-file.tsx
npm run build
npm run build:package
npm --prefix package/honestui run typecheck
```

Replace the example path with the source files you changed. You do not need to
run every command for a documentation-only change, but the site should still
build and changed pages should be checked in a browser.

## Pull requests

In your pull request, explain:

- What changed and why.
- How you tested it.
- Any breaking changes or follow-up work.
- Which issue it resolves, when applicable.

Maintainers may ask for changes to keep APIs, styling, accessibility, and
documentation consistent. Submitting a pull request does not guarantee that it
will be merged.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
