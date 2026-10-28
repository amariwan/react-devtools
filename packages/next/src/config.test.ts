import { describe, expect, it } from "vitest";
import { withNextDevtools } from "./config.js";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("withNextDevtools", () => {
  it("returns a shallow copy without devtools changes in production mode", () => {
    const original = {
      reactStrictMode: true,
      rewrites: async () => [{ source: "/a", destination: "/b" }],
    };
    const result = withNextDevtools(original, { enabled: false });

    expect(result).not.toBe(original);
    expect(result.reactStrictMode).toBe(true);
    expect(result.env).toBeUndefined();
    expect(result.serverExternalPackages).toBeUndefined();
    expect(result.instrumentationClientInject).toBeUndefined();
  });

  it("configures devtools in development mode", () => {
    const result = withNextDevtools(
      { reactStrictMode: true },
      { enabled: true },
    );

    expect(result.reactStrictMode).toBe(true);
    expect(result.env).toMatchObject({ NEXT_DEVTOOLS: "1" });
    expect(result.serverExternalPackages).toContain("@next-devtools/host-next");
    expect(result.serverExternalPackages).toContain("@next-devtools/next");
    expect(result.instrumentationClientInject).toContain(
      "@next-devtools/next/instrumentation-client",
    );
  });

  it("preserves user rewrites", async () => {
    const userRewrites = [{ source: "/x", destination: "/y" }];
    const result = withNextDevtools(
      { rewrites: async () => userRewrites },
      { enabled: true },
    );

    const resolved = await (result.rewrites as () => Promise<unknown>)();
    expect(resolved).toEqual(userRewrites);
  });

  it("does not activate in production even with an explicit development override", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = withNextDevtools(
        { reactStrictMode: true },
        { enabled: true },
      );

      expect(result).not.toBeNull();
      expect(result.reactStrictMode).toBe(true);
      expect(result.env).toBeUndefined();
      expect(result.serverExternalPackages).toBeUndefined();
      expect(result.instrumentationClientInject).toBeUndefined();
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it("merges existing instrumentation client modules", () => {
    const result = withNextDevtools(
      { instrumentationClientInject: ["./my-client.js"] },
      { enabled: true },
    );

    expect(result.instrumentationClientInject).toEqual([
      "./my-client.js",
      "@next-devtools/next/instrumentation-client",
    ]);
  });

  it("does not duplicate the injected module", () => {
    const result = withNextDevtools(
      {
        instrumentationClientInject: [
          "@next-devtools/next/instrumentation-client",
        ],
      },
      { enabled: true },
    );

    expect(result.instrumentationClientInject).toEqual([
      "@next-devtools/next/instrumentation-client",
    ]);
  });

  it("supports explicit trusted roots for monorepo route discovery", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "next-devtools-config-"));
    await mkdir(join(projectRoot, "packages/site/src/app"), {
      recursive: true,
    });
    await writeFile(
      join(projectRoot, "packages/site/src/app/page.tsx"),
      "export default function Page() { return null; }",
    );

    const result = withNextDevtools(
      {},
      {
        enabled: true,
        projectRoot,
        appRoot: "packages/site/src/app",
      },
    );

    expect(result.env?.NEXT_DEVTOOLS_APP_ROOT).toBe("packages/site/src/app");
    expect(JSON.parse(result.env?.NEXT_DEVTOOLS_ROUTE_FILES ?? "[]")).toEqual([
      "packages/site/src/app/page.tsx",
    ]);
  });
});
