# Runtime diagnostics

Browser errors and unhandled rejections are captured automatically in
development. Server errors can be connected through Next.js' supported
`instrumentation` contract without exposing request payloads:

```ts
// instrumentation.ts
import { createNextRequestErrorHandler } from "@next-devtools/next/server";

export const onRequestError = createNextRequestErrorHandler((diagnostic) => {
  // Connect this to the application's development-only diagnostic sink.
  console.error("[next-devtools] server diagnostic", diagnostic);
});
```

The adapter records only the normalized error kind, message, route, digest,
and timestamp. It ignores headers and method, strips query strings from the
path, and preserves the original Next.js error handling. The application still
owns the sink because the DevTools browser runtime cannot safely assume a
server-to-browser transport.

Browser stack frames are initially shown as approximate runtime evidence. For
same-origin generated JavaScript, DevTools boundedly reads the source's
`sourceMappingURL` and upgrades a matching frame to `source-map` / `exact`.
Missing, malformed, cross-origin, or unmapped files retain the approximate
fallback and are never presented as exact.
