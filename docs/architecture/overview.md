# Architecture overview

The workspace is a Bun monorepo. The public entry point is
`@next-devtools/next`; the runtime is split into contracts, host integration,
React inspection, core services, plugins, and the browser UI.

```text
Next config/instrumentation -> @next-devtools/next -> @next-devtools/ui
                                      |                     |
                                      +--> host-next        +--> plugin registry
                                                            +--> runtime services
```

The browser layer never owns filesystem roots or editor authorization. Those
decisions remain in the development-server/host layer. Runtime snapshots are
bounded and disposable; panel code consumes services through the registry.

Current boundaries:

- React Fiber inspection is read-only and compatibility-guarded.
- Next route discovery is build-time/static metadata plus client navigation.
- Network data is browser PerformanceObserver metadata, not server fetch data.
- Server Components and server-side network visibility are not represented as
  client Fiber data.

Evidence: `AUDIT_REPORT.md`, `docs/feature-parity.md`, and `tests/contract`.
