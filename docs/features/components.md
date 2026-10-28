# Components

The Components panel reads current React roots through the Fiber adapter,
builds a bounded tree, and hydrates props/hooks/state/context only for the
selected component. Values are sanitized before entering snapshots.

It supports root selection, filtering, element picking, source display, editor
actions, and selection persistence across panel switches. Suspense boundaries expose explicit `resolved`, `suspended`,
`dehydrated`, or `unknown` state derived from Fiber state. This is client-side
boundary evidence, not a Server Component graph.

The tree renderer virtualizes visible rows with overscan for large bounded
trees, supports roving keyboard focus with Arrow/Home/End navigation, and
refreshes the active inspected root from React commit signals even
when a commit causes no DOM mutation. Commits from the DevTools shell root are
ignored to avoid self-refresh loops. Persistent hover highlighting, favorites,
and exact JSX usage mapping are not complete.
