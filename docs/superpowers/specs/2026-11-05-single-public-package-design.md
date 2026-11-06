# Single public package design

## Intent

Consumers install only `next-devtools`. The current internal workspace
packages remain implementation boundaries, but they are not consumer-facing
dependencies and are not required as separate published packages.

## Approach

Rename the public entry package from `@next-devtools/next` to
`next-devtools`. Keep internal source packages in the monorepo and produce a
self-contained `dist` from the public package build. Preserve the existing
main API and subpath APIs (`/client`, `/server`, `/instrumentation-client`,
etc.). Update examples, tests, release gates, docs, and generated lockfile
metadata together.

The alternative of physically merging every source directory was rejected for
now because it removes useful compile/test boundaries without changing the
consumer contract.

## Acceptance criteria

- `bun add -d next-devtools` is the only required DevTools dependency.
- No published archive contains `workspace:*` dependencies or requires an
  `@next-devtools/*` runtime package beside `next-devtools`.
- Existing public APIs and built-in plugin loading continue to work.
- Repository checks and the isolated package-consumer test pass.
