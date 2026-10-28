# Roadmap

Completed foundations: audit and security fixes, plugin lifecycle rollback,
bounded Fiber indexing, capability reporting, route/network/runtime services,
timeline recording, bounded debug-session capture/compare/export, Suspense
boundary diagnostics, package closure checks, and local CI gates.

Next highest-value work:

1. Extend source-origin metadata with exact component JSX usage mapping and
   cross-origin source-map support; bounded same-origin runtime stack mapping
   is now available while definition/compile/fallback origins remain explicit.
2. Extend the supported opt-in profiler timing layer with evidence-backed
   render-cause analysis. Ranked commits, measured duration summaries, and
   baseline comparisons are now available; the automatic Next instrumentation
   mount remains unable to profile the application tree because it is a separate
   root.
3. Extend the supported Next server metadata path: the public
   `onRequestError` adapter exists, but automatic sink wiring and a live
   Server Component graph are intentionally not claimed.
4. Complete hosted CI and registry smoke tests; local package-mirror consumer
   installation is already verified.
5. Extend the new read-only Zustand/Redux/TanStack Query adapters with a
   reviewed mutation UI and time-travel behind a separate permission and
   lifecycle design; core mutation primitives are now deny-by-default and
   require an explicit host opt-in.
