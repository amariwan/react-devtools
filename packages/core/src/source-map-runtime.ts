export type SourceMapPosition = {
  readonly source: string;
  readonly line: number;
  readonly column: number;
};

type SourceMap = {
  version: 3;
  sources: string[];
  sourceRoot?: string;
  mappings: string;
};

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVlq(value: string, start: number): [number, number] | undefined {
  let result = 0;
  let shift = 0;
  let index = start;
  for (; index < value.length; index++) {
    const digit = BASE64.indexOf(value[index]!);
    if (digit < 0) return undefined;
    result |= (digit & 31) << shift;
    if ((digit & 32) === 0) {
      const negative = (result & 1) === 1;
      const magnitude = result >> 1;
      return [negative ? -magnitude : magnitude, index + 1];
    }
    shift += 5;
    if (shift > 30) return undefined;
  }
  return undefined;
}

function parseSegment(segment: string): number[] | undefined {
  const values: number[] = [];
  let index = 0;
  while (index < segment.length) {
    const decoded = decodeVlq(segment, index);
    if (!decoded) return undefined;
    values.push(decoded[0]);
    index = decoded[1];
  }
  return values;
}

export function resolveSourceMapPosition(
  map: unknown,
  generatedLine: number,
  generatedColumn: number,
  mapUrl?: string,
): SourceMapPosition | undefined {
  if (
    typeof map !== "object" ||
    map === null ||
    (map as { version?: unknown }).version !== 3 ||
    !Array.isArray((map as { sources?: unknown }).sources) ||
    typeof (map as { mappings?: unknown }).mappings !== "string"
  ) {
    return undefined;
  }
  const typed = map as SourceMap;
  if (generatedLine < 1 || generatedColumn < 0) return undefined;

  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;
  const lines = typed.mappings.split(";");
  let best: number[] | undefined;
  for (let lineIndex = 0; lineIndex < generatedLine; lineIndex++) {
    const line = lines[lineIndex];
    if (line === undefined) return undefined;
    let generated = 0;
    for (const segment of line.split(",")) {
      if (!segment) continue;
      const values = parseSegment(segment);
      if (!values || values.length < 1) return undefined;
      generated += values[0]!;
      if (values.length >= 4) {
        sourceIndex += values[1]!;
        originalLine += values[2]!;
        originalColumn += values[3]!;
        if (lineIndex === generatedLine - 1 && generated <= generatedColumn) {
          best = [sourceIndex, originalLine, originalColumn];
        }
      }
    }
  }
  if (!best) return undefined;

  const source = typed.sources[best[0]!];
  if (typeof source !== "string") return undefined;
  const root = typeof typed.sourceRoot === "string" ? typed.sourceRoot : "";
  let resolved = `${root}${source}`;
  if (mapUrl) {
    try {
      resolved = new URL(resolved, mapUrl).toString();
    } catch {
      // Keep the source-map value when it is not a valid URL.
    }
  }
  return {
    source: resolved,
    line: best[1]! + 1,
    column: best[2]! + 1,
  };
}
