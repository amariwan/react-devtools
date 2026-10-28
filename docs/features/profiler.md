# Profiler and performance

The current profiler capability is a bounded React renderer commit signal. The
adapter chains `onCommitFiberRoot` without replacing existing callbacks and
publishes renderer/root/priority metadata. The Timeline stores these events
without synchronous subscriber notification and the browser test verifies real
`react-render · commit` entries.

Timing is available through the explicit `enableProfiler` opt-in on
`DevtoolsProvider` or `NextDevtools`. It wraps that component's child tree with
React's supported `Profiler` callback and records actual/base duration and
commit timestamps in the `react-profiler` timeline layer.

The Timeline derives a ranked render list from those measured commits, including
commit count, total/average/max actual duration, and total base duration. It
also keeps the validated commit history visible. These values are measurements;
they do not claim why a component rendered or that a DOM mutation represents a
React commit.

The Timeline also supports capturing a measured profiler baseline and comparing
current commits against it. Comparisons report changed, added, and removed
components with duration/commit deltas; they do not infer render causality.
Why-did-this-render analysis remains unavailable. The automatic Next.js
instrumentation mount is a separate root and therefore does not profile the
application tree.
