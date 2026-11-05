# Next.js DevTools

Monorepo for a dynamic, plugin-based Next.js DevTools platform (Next.js 16 / React 19, App Router first). bun 1.4.4, Node >=20.

## Commands

- Install: `bun install` (lockfile `bun.lock`)
- Build all (topological): `bun run --filter '*' build` (or `bun run build`)
- Typecheck all: `bun run --filter '*' typecheck` (or `bun run typecheck`) — run after build; cross-package type resolution uses `dist`
- Lint: `bun run lint` (Biome)
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

## UI/UX skills (always use)

- For any UI/UX work, always load and apply the `apple-hig` skill (Apple Human Interface Guidelines) and the `ui-ux-pro-max` skill before designing, reviewing, or modifying interfaces.
- Always use Tailwind CSS with the `devtools:` prefix for styling inside `packages/ui` (see `packages/ui/src/devtools.css`). In plugin/app files outside the Tailwind source scan, prefer inline styles to avoid missing classes.


## Graphify

Knowledge graph at `graphify-out/`. When the user types `/graphify`, use the installed graphify skill first. For codebase questions, run `graphify query "<question>"` when `graphify-out/graph.json` exists; `graphify path "<A>" "<B>"`; `graphify explain "<concept>"`. If `graphify-out/wiki/index.md` exists, use it for broad navigation. Dirty graphify-out files are expected after hooks/incremental updates. After modifying code, run `graphify update .` (AST-only, no API cost). Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **react-devtools** (4503 symbols, 8735 relationships, 204 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/react-devtools/context` | Codebase overview, check index freshness |
| `gitnexus://repo/react-devtools/clusters` | All functional areas |
| `gitnexus://repo/react-devtools/processes` | All execution flows |
| `gitnexus://repo/react-devtools/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
