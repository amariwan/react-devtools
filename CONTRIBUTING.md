# Contributing to Next DevTools

Thanks for your interest in contributing! This document outlines how to contribute to Next DevTools.

## Development Setup

Requirements: [Bun](https://bun.sh) 1.4.4, Node.js >= 20.

```bash
git clone https://github.com/amariwan/react-devtools.git
cd react-devtools
bun install
bun run build
```

See the [README](README.md) for more details on running the example app.

## Commit Conventions

This project follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

### Supported types

- `feat` - A new feature
- `fix` - A bug fix
- `perf` - A performance improvement
- `refactor` - A code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only changes
- `test` - Adding missing tests or correcting existing tests
- `build` - Changes that affect the build system or external dependencies
- `ci` - Changes to our CI configuration files and scripts
- `chore` - Other changes that don't modify src or test files
- `revert` - Reverts a previous commit

### Examples

```
feat(components): add component inspection
fix(router): handle optional catch-all routes
perf(runtime): reduce inspector overhead
docs: improve installation guide
refactor(core): simplify plugin lifecycle
test(editor): add security regression tests
chore(release): prepare next version
```

### Breaking changes

Use `!` after the type/scope to indicate a breaking change, and include a `BREAKING CHANGE:` footer with migration instructions.

```
feat(core)!: change plugin registration API

BREAKING CHANGE: Plugins must now use the new registration API. See migration guide.
```

## Changelog and Releases

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

1. **Make your changes** - Implement your feature or fix.
2. **Add a changeset** - Run `bun run changeset` and follow the prompts to describe your change.
3. **Commit the changeset** - Commit the generated file in `.changeset/` along with your changes.
4. **Open a PR** - Tests and checks will run via CI.

Changesets will automatically version packages and update changelogs when a release is prepared.

## Pull Request Guidelines

Before opening a PR:

1. Read [AGENTS.md](AGENTS.md) and relevant package documentation
2. Add tests for behavioral changes or bug fixes
3. Run formatting, lint, typecheck, and relevant focused tests
4. Verify DevTools behavior in development and absence in production
5. Keep public contract changes backward-compatible or document the migration

## Code Style

- Use TypeScript with strict mode
- Follow existing codebase patterns and conventions
- Run `bun run format` before committing
- Run `bun run lint` and fix any issues

## Questions?

Feel free to open an issue if you have questions or need clarification.
