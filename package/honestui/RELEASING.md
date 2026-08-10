# Releasing honestui

Package releases are built, verified, and published by
.github/workflows/honestui-publish.yml.

## One-time npm setup

Configure honestui on npm with a GitHub Actions trusted publisher:

- Organization: honestui
- Repository: honestui
- Workflow: honestui-publish.yml
- Allowed action: npm publish

Trusted publishing requires npm 11.5.1 or newer and uses GitHub OpenID Connect,
so the workflow does not need a long-lived npm token. npm generates provenance
for public packages published from a public repository through this flow.

## Release checklist

1. Update package.json and CHANGELOG.md with the new version and verified
   changes.
2. Merge the change only after the package and site release gates pass.
3. Create a GitHub release whose tag is exactly v<package version>.
4. Publish the GitHub release. The publish workflow verifies the tag, runs the
   complete package release suite, and publishes to npm.
5. Confirm npm shows the expected version, files, entry points, and provenance.

The workflow stops before publishing when the tag and package version differ or
any verification step fails.
