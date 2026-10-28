# React/Next.js DevTools – Parity Report

Date: 2026-10-28

This report is a compatibility index. `AUDIT_REPORT.md` and
`docs/feature-parity.md` are the current evidence-backed sources for the
implementation status; older counts in this file must not be used as current
verification.

## Gate Results

| Gate                       | Result                        |
| -------------------------- | ----------------------------- |
| bun run typecheck          | PASS (all packages)           |
| bun run lint               | PASS                          |
| bun run test:unit          | PASS (279 tests / 44 files)   |
| bun run --filter '*' build | PASS (showcase build exits 0) |
| Playwright Chromium E2E    | PASS (13 tests)               |
| Playwright WebKit E2E      | PASS (13 tests)               |
| Production Playwright E2E  | PASS (1 test)                 |
| Dev server (showcase)      | PASS (HTTP 200)               |

## Feature Table

| Feature                                        | Implementation                                         | Test                        | Status |
| ---------------------------------------------- | ------------------------------------------------------ | --------------------------- | ------ |
| Single-package install (`@next-devtools/next`) | `packages/next` exports `withNextDevtools`             | config.test.ts              | PASS   |
| `withNextDevtools()` config entry              | `packages/next/src/config.ts`                          | config.test.ts              | PASS   |
| Dev-only activation                            | `enabled = NODE_ENV !== production && options.enabled` | config.test.ts              | PASS   |
| Auto client mount                              | `instrumentation-client.tsx` guards                    | smoke.spec.ts               | PASS   |
| Open-in-Editor authorization (fail closed)     | `open-in-editor-action.ts`                             | open-in-editor tests        | PASS   |
| Editor allowlist (vscode, cursor)              | `source-inspector` registry                            | open-in-editor tests        | PASS   |
| Path validation (traversal, symlink, roots)    | `source-inspector` + editor-bridge                     | security tests              | PASS   |
| React fiber bridge                             | `runtime-react/react-fiber-adapter.ts`                 | react-fiber-adapter tests   | PASS   |
| Capability descriptors                         | `react-capabilities.ts`                                | react-capabilities tests    | PASS   |
| Components panel (tree + inspector + open)     | `plugins/components/ComponentsPanel.tsx`               | component-tree-data tests   | PASS   |
| Element picker                                 | `ui/element-picker.tsx`                                | pick.spec.ts                | PASS   |
| Shell keyboard/ARIA                            | `ui/shell.tsx` + `shell-affordances.ts`                | shell-affordances tests     | PASS   |
| Overview panel + health diagnostics            | `plugins/overview` + selector                          | panel-data tests            | PASS   |
| Pages / Router panel (live data)               | `plugins/pages` + route runtime                        | panel-data tests            | PASS   |
| Network panel (live data)                      | `plugins/network` + network runtime                    | panel-data tests            | PASS   |
| Graph panel (live data)                        | `plugins/graph` + react runtime                        | panel-data tests            | PASS   |
| CSS / Tailwind panel (live data)               | `plugins/css-tailwind` + selector                      | panel-data tests            | PASS   |
| Zustand panel (live data)                      | `plugins/state-zustand` + selector                     | panel-data tests            | PASS   |
| Redux panel (live data)                        | `plugins/state-redux` + selector                       | panel-data tests            | PASS   |
| TanStack Query panel (live data)               | `plugins/state-tanstack-query` + selector              | panel-data tests            | PASS   |
| Plugin registry hardening                      | `core/plugin-registry.ts`                              | plugin-runtime tests        | PASS   |
| Showcase build + E2E                           | `examples/next16-devtools-showcase`                    | pick.spec.ts, smoke.spec.ts | PASS   |

## Remaining Work (Prioritized)

1. Hosted CI execution and native Safari verification remain unverified — PARTIAL.
2. Route discovery supports explicit trusted `projectRoot`/`appRoot` options and has a monorepo contract test; a live custom-host integration run remains unverified — PARTIAL.
3. State integrations (Zustand/Redux/TanStack Query) are read-only; mutation permissions and time travel remain — PARTIAL.
4. Open-in-Editor exact usage-location vs definition-location distinction is explicit; exact JSX/source-map mapping remains unavailable — PARTIAL.
5. Correct `packages/next` pack archive and an isolated local-mirror consumer install are exercised by the compatibility suite; hosted registry install remains NOT RUN.

## Security Notes

- Client-supplied roots removed from externally callable contract; trusted roots derived server-side.
- Path traversal, symlink escape, and untrusted roots rejected.
- Editor targets restricted to vscode/cursor via registry; fixed executable mappings.
- Authorization fails closed on missing/invalid host/origin.
- DevTools disabled in production via `withNextDevtools`.
- Server-only modules kept out of client bundle via subpath imports.

## Runtime Limitations (Honest)

- React bridge relies on React Fiber `_debugSource`; unavailable fields reported as unavailable, never fabricated.
- CSS panel only reads accessible (same-origin) stylesheets.
- State panels detect adapters/globals but do not mutate unless an adapter is registered.
- Graph edges are parent-child only; no invented relations.
