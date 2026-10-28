<div align="center">

# Next DevTools

### Understand your React app. Trace what happened. Get back to building.

**Development-only, plugin-powered DevTools for React 19 and Next.js 16.**

Inspect components, routes, render events, browser network timing, and runtime diagnostics — from one integrated workspace.

[**Get started**](#get-started) · [**Explore features**](#features) · [**Architecture**](#architecture) · [**Documentation**](#documentation) · [**Contributing**](#development)

[![Verify](https://github.com/amariwan/react-devtools/actions/workflows/verify.yml/badge.svg)](https://github.com/amariwan/react-devtools/actions/workflows/verify.yml)
![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.4-14151a?logo=bun&logoColor=white)

**Pre-release** · Built for local development · [Report an issue](https://github.com/amariwan/react-devtools/issues)

</div>

---

## Why Next DevTools?

React DevTools tells you about components. Your browser tells you about requests. Next.js has its own routing and development diagnostics. Switching between these views makes everyday debugging harder than it needs to be.

**Next DevTools brings the evidence into one place** — with direct navigation between what you see on screen, the React component that rendered it, and the source information available in development.

- **Inspect the UI:** find a component, explore its props and state, or pick an element directly on the page.
- **Follow application behavior:** browse App Router routes and observe React commits, timeline events, and network resource timing.
- **Move from observation to action:** open a validated source location in VS Code or Cursor when source evidence is available.
- **Debug with context:** inspect runtime errors and capture bounded, sanitized debug sessions.
- **Extend the workspace:** add inspectors, commands, and timeline layers through a plugin registry.

> **Honest by design:** DevTools shows the data React, Next.js, and the browser actually expose. Missing source locations, unavailable server data, and unsupported mutations are clearly identified — never replaced with fake live data.

## Get started

> [!NOTE]
> The public package is being prepared for release. The package-install commands below describe the intended consumer experience once `@next-devtools/next` is published. To try the current source, use [Run from source](#run-from-source).

### 1. Install

```bash
bun add -d @next-devtools/next
```

### 2. Configure once

In `next.config.ts`:

```ts
import type { NextConfig } from "next";
import { withNextDevtools } from "@next-devtools/next";

const nextConfig: NextConfig = {
  // Your existing Next.js configuration
};

export default withNextDevtools(nextConfig);
```

### 3. Start developing

```bash
bun dev
```

Open your application and launch **Next DevTools**. Built-in integrations are loaded through the plugin registry; no application-owned editor API implementation is required for the preferred integration path.

For monorepos or nonstandard App Router locations, configure trusted roots on the server:

```ts
export default withNextDevtools(nextConfig, {
  projectRoot: process.cwd(),
  appRoot: "apps/web/src/app",
});
```

See [package setup and configuration](packages/next/README.md) for details.

## Features

| Tool                  | What it helps you do                                                                                            | Current scope                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Components**        | Explore React roots and component trees; inspect selected props, hooks, state, context, and Suspense boundaries | Read-only, bounded inspection                                         |
| **Pick element**      | Select a rendered element and navigate to its owning component                                                  | Source quality depends on available development metadata              |
| **Open in editor**    | Open a validated file, line, and column in VS Code or Cursor                                                    | Local development only                                                |
| **Pages & routes**    | Browse discovered App Router routes, inspect parameters, and follow navigation                                  | Client navigation and discovered route metadata                       |
| **Timeline**          | Record and inspect runtime events, including React commit signals                                               | Bounded recording with explicit coverage                              |
| **Profiler insights** | Review measured render timings, rankings, and baseline comparisons                                              | Timing requires opt-in profiling of the application tree              |
| **Network**           | Investigate browser resource timing and available response-status metadata                                      | Browser-visible metadata only; no server-fetch or request-body claims |
| **State adapters**    | Inspect compatible Zustand, Redux, and TanStack Query state                                                     | Optional, read-only integrations                                      |
| **Diagnostics**       | Explore runtime errors, failed plugins, and capability health                                                   | Evidence-based diagnostics                                            |
| **Debug sessions**    | Capture, compare, and export bounded runtime evidence                                                           | Sanitized structured data                                             |
| **Agent / MCP**       | Expose controlled, read-only inspection data to developer agents                                                | Host-authorized integration; not an unrestricted remote service       |

The UI also provides dynamic plugin navigation, search, inspector panels, and an isolated styling boundary.

### Pick an element, find the source

1. Activate **Pick element** in the Components panel.
2. Select an element on your page.
3. Inspect the owning component and available source evidence.
4. Choose **Open in editor** to jump to the validated location.

Source evidence is explicitly classified. A **component definition** is not silently labeled as the **exact JSX usage**. Exact usage resolution remains dependent on the available instrumentation.

[Read the source-mapping details](docs/features/open-in-editor.md).

### Follow a debugging session

Use the Timeline, Network, Diagnostics, and Components views together to investigate a behavior, then export sanitized evidence for a bug report or further analysis.

Network coverage is deliberately limited to browser-observable resource data. Server requests, database calls, request bodies, and private headers require separate approved instrumentation.

[Read the Network scope](docs/features/network.md) · [Read about diagnostics](docs/features/diagnostics.md).

## Architecture

One developer-facing package, with focused internals:

```text
@next-devtools/next               Public Next.js integration
         |
         +-- Next.js configuration and development bootstrap
         +-- React runtime adapter and source inspection
         +-- Observable core services and plugin registry
         +-- Isolated React DevTools UI
         +-- Built-in and optional inspectors
```

| Directory                           | Responsibility                                    |
| ----------------------------------- | ------------------------------------------------- |
| `packages/next`                     | Public integration, configuration, plugin loading |
| `packages/runtime-react`            | React inspection and runtime bridge               |
| `packages/core`                     | Runtime services, registry, timelines, sessions   |
| `packages/contracts`                | Shared typed contracts                            |
| `packages/plugin-sdk`               | Plugin lifecycle and extension API                |
| `packages/host-next`                | Next.js-specific host capabilities                |
| `packages/source-inspector`         | Source and editor location handling               |
| `packages/ui`                       | Dock, navigation, and inspector interface         |
| `plugins`                           | Built-in and optional tools                       |
| `examples/next16-devtools-showcase` | Next.js integration showcase                      |
| `tests`                             | Contract, compatibility, and browser verification |

Plugins register capabilities, panels, inspectors, and commands without hardcoding their navigation into the shell. Browser data and privileged local actions are separated by explicit contracts.

[Architecture](docs/architecture/overview.md) · [Runtime](docs/architecture/runtime.md) · [Plugin system](docs/architecture/plugin-system.md).

## Development and verification

### Run from source

Requirements: **Bun 1.4.4**, **Node.js 20+**.

```bash
git clone https://github.com/amariwan/react-devtools.git
cd react-devtools

bun install
bun run build
bun run --filter next16-devtools-showcase dev
```

Open [http://localhost:3000](http://localhost:3000) unless the development server selects another port.

> Install from the **monorepo root** so Bun can resolve all `workspace:*` dependencies.

### Quality checks

```bash
bun run build                # Build workspace packages
bun run typecheck            # Type-check packages
bun run lint                 # ESLint
bun run format:check         # Prettier
bun run test:unit            # Unit and contract tests
bun run test:e2e             # Chromium
bun run test:e2e:webkit      # WebKit
bun run test:e2e:production  # Production smoke test
bun run perf:baseline        # Bounded runtime performance baseline
```

GitHub Actions configuration: [Verify workflow](.github/workflows/verify.yml).

A green build alone does not prove feature parity. Browser workflows, independent package installation, and security boundaries need separate verification.

## Security and privacy

Next DevTools is designed for **authorized local development**, not as a production monitoring service.

- `withNextDevtools` does not inject the development client in production.
- Opening an editor is a privileged development action with server-owned roots and validated paths.
- Runtime and network buffers are bounded.
- Network exports redact sensitive metadata.
- Store inspection is read-only by default; mutation requires separate explicit capability and authorization.
- Agent integrations have bounded, permission-controlled read surfaces.

Never expose local editor execution or developer-agent transports on a public endpoint.

[Read the security model](docs/architecture/security.md).

## Current limitations

This project is actively evolving. The following are **not** claimed as complete:

- Reliable exact JSX **usage-site** mapping for every React component
- Automatic **why did this render** causal explanations
- A complete live React Server Component dependency graph
- Full visibility into server-side requests and application data
- General-purpose state editing or time-travel debugging
- An unrestricted plug-and-play remote MCP endpoint
- Native Safari validation solely from Playwright WebKit results

See the [roadmap](docs/roadmap.md), [component inspection](docs/features/components.md), and [profiler scope](docs/features/profiler.md).

## Documentation

| Topic                       | Guide                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| Component inspection        | [Components](docs/features/components.md)                              |
| Element picking and editors | [Open in Editor](docs/features/open-in-editor.md)                      |
| Routing                     | [Router](docs/features/router.md)                                      |
| Network coverage            | [Network](docs/features/network.md)                                    |
| Rendering and profiling     | [Profiler](docs/features/profiler.md)                                  |
| Agent integration           | [Agent / MCP](docs/features/ai-mcp.md)                                 |
| CLI helpers                 | [CLI](docs/features/cli.md)                                            |
| Security                    | [Security architecture](docs/architecture/security.md)                 |
| Browser support             | [Compatibility](docs/testing/browser-compatibility.md)                 |
| Changelog                   | [CHANGELOG](CHANGELOG.md)                                              |
| Releases                    | [GitHub Releases](https://github.com/amariwan/react-devtools/releases) |
| Contributing                | [CONTRIBUTING](CONTRIBUTING.md)                                        |
| Release management          | [Release guide](docs/maintainers/releasing.md)                         |
| Publishing                  | [Publishing details](docs/release/publishing.md)                       |
| Product direction           | [Roadmap](docs/roadmap.md)                                             |

## Contributing

Contributions, bug reports, reproducible test cases, and focused pull requests are welcome.

Before opening a PR:

1. Read [AGENTS.md](AGENTS.md) and the relevant package documentation.
2. Add tests for behavioral changes or bug fixes.
3. Run formatting, lint, typecheck, and relevant focused tests.
4. Verify DevTools behavior in development **and** absence in production.
5. Keep public contract changes backward-compatible or document the migration.

[Open an issue](https://github.com/amariwan/react-devtools/issues) · [Browse pull requests](https://github.com/amariwan/react-devtools/pulls)

## License

**MIT is the chosen project license.** The repository's root `LICENSE` file and published package metadata must be finalized before the first public release. Existing third-party licenses and notices remain applicable.

---

<div align="center">

Built to make debugging React and Next.js applications more direct, transparent, and productive.

**[Back to top](#next-devtools)**

</div>
