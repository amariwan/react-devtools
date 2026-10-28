# @next-devtools/next

Development-only React and Next.js DevTools for Next.js 16 and React 19.

## Install

```bash
bun add -d @next-devtools/next
```

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withNextDevtools } from "@next-devtools/next";

const nextConfig: NextConfig = {};

export default withNextDevtools(nextConfig);
```

Run `bun dev` and open the launcher in the application. The integration is
enabled by default outside production and injects the client instrumentation
through Next.js configuration. Existing rewrites and instrumentation modules
are preserved.

For monorepos or custom Next.js hosts, route discovery can use explicit trusted
server-side roots:

```ts
export default withNextDevtools(nextConfig, {
  projectRoot: process.cwd(),
  appRoot: "packages/web/src/app",
});
```

These options are read from the server config only; browser input cannot
override them.

## What is included

- React component inspection, element picking, and source locations
- Next.js route/pages, navigation, timeline, and network inspection
- Read-only Zustand, Redux, and TanStack Query adapters when detected
- Runtime diagnostics, bounded debug sessions, universal search, and an
  optional read-only Agent/MCP surface

The public package loads built-in plugins lazily. Optional integrations remain
read-only unless a capability explicitly exposes another operation.

## Production and security

`withNextDevtools` does not inject DevTools when `NODE_ENV` is `production` or
when `{ enabled: false }` is supplied. Open-in-editor requests are restricted
to server-configured development roots, canonicalized paths, and fixed editor
mappings; browser input cannot select arbitrary executables or filesystem roots.

See the repository documentation for
[architecture](https://github.com/amariwan/react-devtools/blob/main/docs/architecture/overview.md),
[security](https://github.com/amariwan/react-devtools/blob/main/docs/architecture/security.md),
and [publishing](https://github.com/amariwan/react-devtools/blob/main/docs/release/publishing.md).

## License

This package and the repository code are released under the [MIT License](../../LICENSE).
The published package includes the same `LICENSE` file. Third-party dependencies
retain their own copyright and license notices.
