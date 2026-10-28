// Client-side instrumentation helpers for Next.js App Router.
// Intended to be called from instrumentation-client.ts.

export type NavigationEvent = {
  url: string;
  startedAtUnixMs: number;
  type: "navigation-start" | "navigation-complete";
};

export function createNavigationTracker(emit: (e: NavigationEvent) => void) {
  let currentUrl = typeof location !== "undefined" ? location.href : "";
  return {
    onRouterTransitionStart(url: string) {
      emit({ url, startedAtUnixMs: Date.now(), type: "navigation-start" });
    },
    onRouteChangeComplete(url: string) {
      emit({ url, startedAtUnixMs: Date.now(), type: "navigation-complete" });
      currentUrl = url;
    },
    currentUrl() {
      return currentUrl;
    },
  };
}

export function reportWebVitals(metric: {
  name: string;
  value: number;
  rating?: string;
}) {
  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating ?? "unknown",
  };
}
