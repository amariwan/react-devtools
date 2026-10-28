import { describe, expect, it } from "vitest";
import {
  createRouteRuntimeService,
  scanAppRouter,
} from "@next-devtools/host-next";

const tree = scanAppRouter([
  "app/layout.tsx",
  "app/page.tsx",
  "app/blog/[slug]/page.tsx",
  "app/docs/[...parts]/page.tsx",
]);

describe("route runtime service", () => {
  it("matches the active route and extracts decoded params", () => {
    const runtime = createRouteRuntimeService({
      tree,
      url: "/blog/hello%20world?preview=1",
    });

    expect(runtime.getSnapshot().data).toMatchObject({
      pathname: "/blog/hello%20world",
      params: { slug: "hello world" },
      searchParams: { preview: ["1"] },
    });
    expect(runtime.getSnapshot().data.activeSegmentIds).toContain(
      "blog/[slug]",
    );
  });

  it("updates params and repeated search params when location changes", () => {
    const runtime = createRouteRuntimeService({ tree, url: "/" });

    runtime.setLocation("/docs/a/b?tag=one&tag=two");

    expect(runtime.getSnapshot().data.params).toEqual({ parts: ["a", "b"] });
    expect(runtime.getSnapshot().data.searchParams).toEqual({
      tag: ["one", "two"],
    });
  });

  it("notifies subscribers until they detach", () => {
    const runtime = createRouteRuntimeService({ tree, url: "/" });
    let notifications = 0;
    const unsubscribe = runtime.subscribe(() => notifications++);
    runtime.setLocation("/blog/first");
    unsubscribe();
    runtime.setLocation("/blog/second");

    expect(notifications).toBe(1);
  });
});
