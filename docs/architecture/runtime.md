# Runtime architecture

Runtime services implement `RuntimeServiceSnapshot<T>` with status, reason,
revision, bounded data, and subscriptions. Core services include timeline,
network, sessions, and state adapters. React inspection is registered under
`next-devtools.runtime.react`.

React adapters expose lazy operations for roots, tree, detail, source,
selection, Suspense diagnostics, and commit notifications. Async reads carry
generation and request revisions so replaced adapters cannot overwrite the
current session.

Timeline events are bounded by a ring buffer. React commit events use silent
ingestion plus explicit polling in the Timeline panel; this prevents a panel
store update from recursively generating the commit it observes.

The adapter reports only available evidence. It does not turn DOM mutations
into React commits, invent render durations, or infer Server Component state
from client Fibers.
