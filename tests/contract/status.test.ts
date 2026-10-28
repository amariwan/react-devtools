import { describe, expect, it } from "vitest";
import { STATUS_LABELS, STATUS_TONES, statusTone } from "@next-devtools/ui";

describe("statusTone", () => {
  it("maps known runtime statuses and availabilities to tones", () => {
    expect(statusTone("available")).toBe("available");
    expect(statusTone("partial")).toBe("partial");
    expect(statusTone("requires-instrumentation")).toBe(
      "requires-instrumentation",
    );
    expect(statusTone("experimental")).toBe("experimental");
    expect(statusTone("unavailable")).toBe("unavailable");
    expect(statusTone("error")).toBe("error");
    expect(statusTone("diagnostic")).toBe("diagnostic");
  });

  it("collapses unknown values to unavailable", () => {
    expect(statusTone("bogus")).toBe("unavailable");
    expect(statusTone("")).toBe("unavailable");
  });

  it("provides a label for every declared tone", () => {
    for (const tone of STATUS_TONES) {
      expect(STATUS_LABELS[tone].length).toBeGreaterThan(0);
    }
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...STATUS_TONES].sort());
  });
});
