# Release Guide

This guide documents how to prepare, verify, and publish releases for Next DevTools.

## Versioning Policy

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

- **MAJOR**: Breaking public API changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

For pre-1.0 releases (current state), breaking changes may occur in minor versions. We still document breaking changes clearly with migration guidance.

### Prerelease versions

When appropriate, prerelease versions may be used:

- `x.y.z-alpha.n`
- `x.y.z-beta.n`
- `x.y.z-rc.n`

Stable releases require verification and authorization before publishing.

## Changelog Conventions

We follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

Changelogs are organized by:

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

Only non-empty categories are included. The latest release appears first. Breaking changes are clearly marked.

## Changesets Workflow

We use [Changesets](https://github.com/changesets/changesets) as the source of truth for versioning and release notes.

### For contributors

1. Make your changes
2. Run `bun run changeset` to create a changeset describing your change
3. Commit the changeset file (`.changeset/*.md`) with your changes
4. Open a PR

### For maintainers - preparing a release

1. **Merge changesets** - Ensure all changesets from merged PRs are present
2. **Version packages** - Run `bun run version-packages` to consume changesets and update versions/changelogs
3. **Review** - Review the generated version bumps and changelog updates
4. **Commit** - Commit the version changes
5. **Publish** - Run `bun run release` to publish packages and create tags (when authorized)

```bash
bun run version-packages  # Updates package versions and CHANGELOG.md files
bun run release          # Publishes packages to npm
```

## Package Publishing

### Public packages

The main public package is `@next-devtools/next`. Internal packages are published as needed for the dependency graph (see `.changeset/public-runtime-packages.md` and `.changeset/config.json`).

### Publishing validation

Before publishing, verify:

- Package builds successfully (`bun run build`)
- Typecheck passes (`bun run typecheck`)
- Tests pass (`bun run test:unit`)
- Compatibility tests pass (`bunx vitest run tests/compatibility`)
- Package contents are correct (see `docs/release/publishing.md`)
- The complete local release gate passes (`bun run validate:release`)
- The Verify GitHub Actions workflow is green on `main`

### Dry-run

```bash
cd packages/next
bun pm pack --destination /tmp/next-devtools-pack
```

Verify the archive contains `LICENSE` and correct metadata.

## Prerelease Publishing

For prereleases (alpha/beta/rc):

1. Enter prerelease mode: `bunx changeset pre enter <tag>` (e.g., `beta`)
2. Version and publish as usual
3. Exit prerelease mode when ready: `bunx changeset pre exit`

## Handling Breaking Changes

Breaking changes must:

1. Be marked with `!` in commit messages or clearly described in changesets
2. Include migration instructions in the changeset description
3. Be documented in the CHANGELOG under the appropriate release
4. Be called out prominently in release notes

## Rollback Procedure

If a release has issues:

1. **Do not unpublish** from npm if possible (npm doesn't allow unpublishing after 72 hours in many cases)
2. **Publish a patch** with a fix if the issue is fixable
3. **Deprecate** the broken version: `npm deprecate @next-devtools/next@x.y.z "Broken, use x.y.z+1 instead"`
4. **Document** the issue in the changelog and release notes
5. **Communicate** the issue through GitHub releases/issues

## GitHub Releases

GitHub releases are created from git tags. Release notes should explain what changed and why it matters, with migration guidance for breaking changes.

The `.github/release.yml` configures release note categorization.

## Security

- **Trusted publishing**: Prefer OIDC trusted publishing over long-lived tokens when supported
- **No secrets in logs**: Ensure CI never logs credentials
- **Gated publishing**: Publishing should only happen from protected branches/tags with appropriate permissions
- **No publishing from PRs**: Workflows must not publish from untrusted pull requests
- **Verify before publish**: All checks must pass before publishing

## Links

- [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md)
- [Publishing Details](publishing.md)
- [GitHub Releases](https://github.com/amariwan/react-devtools/releases)
