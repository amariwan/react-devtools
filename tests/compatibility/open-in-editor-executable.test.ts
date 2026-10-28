import path from "node:path";
import { describe, it, expect } from "vitest";
import { openInEditor } from "@next-devtools/host-next/editor";

describe("open-in-editor executable mapping", () => {
  it("spawns cursor with exact file, line, and column", async () => {
    const calls: Array<{ executable: string; args: string[] }> = [];
    const spawn = (
      executable: string,
      args: string[],
      events: { spawn(): void },
    ) => {
      calls.push({ executable, args });
      events.spawn();
    };
    const file = path.resolve(process.cwd(), "src/app/page.tsx");
    const result = await openInEditor(
      file,
      7,
      9,
      "cursor",
      [path.resolve(process.cwd(), "src")],
      {
        spawn,
        canonicalize: async () => ({ ok: true, canonical: file }),
      },
    );
    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      { executable: "cursor", args: ["--goto", `${file}:7:9`] },
    ]);
  });

  it("spawns code for vscode", async () => {
    const calls: Array<{ executable: string; args: string[] }> = [];
    const spawn = (
      executable: string,
      args: string[],
      events: { spawn(): void },
    ) => {
      calls.push({ executable, args });
      events.spawn();
    };
    const file = path.resolve(process.cwd(), "src/app/page.tsx");
    const result = await openInEditor(
      file,
      1,
      1,
      "vscode",
      [path.resolve(process.cwd(), "src")],
      {
        spawn,
        canonicalize: async () => ({ ok: true, canonical: file }),
      },
    );
    expect(result).toEqual({ ok: true });
    expect(calls[0].executable).toBe("code");
  });
});
