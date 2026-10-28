# Release readiness

This is an evidence ledger, not a promise that an npm or GitHub release has
occurred. A check is `PASS` only when the command has actually completed
successfully in the stated environment.

## Current local evidence — 2026-10-28

| Gate                       | Command / workflow                      | Status  | Evidence                                                            |
| -------------------------- | --------------------------------------- | ------- | ------------------------------------------------------------------- |
| Formatting                 | `bun run format:check`                  | PASS    | All files matched Prettier                                          |
| Lint                       | `bun run lint`                          | PASS    | ESLint exited 0                                                     |
| Build                      | `bun run build`                         | PASS    | All packages and showcase built                                     |
| Typecheck                  | `bun run typecheck`                     | PASS    | All workspace packages exited 0                                     |
| Unit/contract              | `bun run test:unit`                     | PASS    | 44 files, 279 tests                                                 |
| Compatibility/consumer     | `bun run test:compatibility`            | PASS    | 3 files, 18 tests                                                   |
| Performance                | `bun run perf:baseline`                 | PASS    | Bounded retention and timing output recorded                        |
| Dependency vulnerabilities | `bun audit`                             | PASS    | 582 packages, no vulnerabilities                                    |
| Secret pattern scan       | `bun run validate:security`            | PASS    | 281 source/config files checked                                    |
| Changesets                 | `bunx changeset status`                 | PASS    | Changeset graph resolved on local `main`                            |
| Package archives           | `bun run validate:packages`             | PASS    | Public archive metadata and contents validated                      |
| Chromium E2E               | `bun run test:e2e`                      | PASS    | 13 tests passed locally                                             |
| WebKit E2E                 | `bun run test:e2e:webkit`               | PASS    | 13 tests passed locally; not native Safari                          |
| Production smoke           | `bun run test:e2e:production`           | PASS    | 1 test passed locally; DevTools absent in production                |
| GitHub CI                  | `.github/workflows/verify.yml`          | NOT RUN | No remote CI run observed locally                                   |
| Branch protection          | `docs/maintainers/branch-protection.md` | BLOCKED | GitHub settings require repository-admin access                     |
| Remote tracking            | `git branch -vv`                        | BLOCKED | No configured remote; supplied repository URL currently returns 404 |

## Contract

The release contract is implemented by `verify.yml` and the local scripts in
`scripts/release-gates.mjs`. A merge is not release-ready while a mandatory
browser, CI, or protected-branch check is `NOT RUN` or `BLOCKED`.

Publishing remains a separate authorized action. The release workflow uses
Changesets and npm provenance/Trusted Publishing configuration, but this task
does not publish packages or create a GitHub release.
