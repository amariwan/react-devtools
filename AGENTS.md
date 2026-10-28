# Next.js DevTools

Monorepo for a dynamic, plugin-based Next.js DevTools platform (Next.js 16 / React 19, App Router first). bun 1.4.4, Node >=20.

## Commands

- Install: `bun install` (lockfile `bun.lock`)
- Build all (topological): `bun run --filter '*' build` (or `bun run build`)
- Typecheck all: `bun run --filter '*' typecheck` (or `bun run typecheck`) — run after build; cross-package type resolution uses `dist`
- Lint: `bun run lint` (ESLint 9 flat config + typescript-eslint)
- Format: `bun run format` / `bun run format:check`
- Unit/contract tests: `bun run test:unit` (root Vitest; aliases package `src`) or `bun run --filter '*' test` (per-package tests in `dist`)
- E2E: `bun run test:e2e` (Playwright; boots a dev server on :3000)
- Single test file: `bunx vitest run tests/contract/value-codec.test.ts`
- Single package: `bun run --filter @next-devtools/core build|typecheck|test`
- Releases: changesets (`bun run changeset`, `bun run version-packages`, `bun run release`)

## Structure

- `packages/*` – contracts, core, plugin-sdk, host-next, runtime-react, source-inspector, ui, transport-devframe, cli, next
- `plugins/*` – 11 plugins (overview, components, pages, network, graph, state-*, css-tailwind, agent-mcp, showcase-custom-inspector)
- `tests/contract` – 20 contract + runtime tests; `tests/browser` – Playwright smoke; `tests/compatibility` – open-in-editor + single-package tests
- `examples/next16-devtools-showcase` – full Next 16 showcase app with stores/RSC (the demo app; no `apps/` dir currently)

## Architecture notes

- Workspace globs: `apps/*`, `packages/*`, `plugins/*`, `tests/*`, `examples/*`.
- Dependency order: contracts → plugin-sdk → core/source-inspector → host-next/ui/runtime-react/next → plugins → apps. `bun run --filter '*'` resolves topologically.

## References

- `docs/` (ADRs, capability matrix, verification report, plugin cookbook, bundler diagnostics)
- Product blueprint is authoritative spec.
- Design tokens & themes: `docs/DESIGN.md`.
