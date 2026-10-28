// Value codec for cross-process serialization.
// Handles undefined, BigInt, Date, Error, Map, Set, cycles, large arrays.
// Deep inspection is lazy/bounded; this codec is for snapshot transport.

export const VALUE_CODEC_LIMITS = {
  maxDepth: 8,
  maxArrayLength: 200,
  maxObjectKeys: 100,
  maxStringLength: 4096,
} as const;

export type EncodedValue =
  | null
  | boolean
  | number
  | string
  | { __ndt_type: "undefined" }
  | { __ndt_type: "bigint"; value: string }
  | { __ndt_type: "date"; value: string }
  | { __ndt_type: "error"; name: string; message: string; stack?: string }
  | { __ndt_type: "regexp"; source: string; flags: string }
  | { __ndt_type: "map"; entries: Array<[EncodedValue, EncodedValue]> }
  | { __ndt_type: "set"; values: EncodedValue[] }
  | { __ndt_type: "array"; items: EncodedValue[]; truncated?: boolean }
  | {
      __ndt_type: "object";
      entries: Array<[string, EncodedValue]>;
      truncated?: boolean;
    }
  | { __ndt_type: "ref"; path: string }
  | { __ndt_type: "function"; name: string }
  | { __ndt_type: "symbol"; description: string | null };

export type EncodeOptions = {
  maxDepth?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
  maxStringLength?: number;
};

export function encodeValue(
  value: unknown,
  options: EncodeOptions = {},
): EncodedValue {
  const maxDepth = options.maxDepth ?? VALUE_CODEC_LIMITS.maxDepth;
  const maxArrayLength =
    options.maxArrayLength ?? VALUE_CODEC_LIMITS.maxArrayLength;
  const maxObjectKeys =
    options.maxObjectKeys ?? VALUE_CODEC_LIMITS.maxObjectKeys;
  const maxStringLength =
    options.maxStringLength ?? VALUE_CODEC_LIMITS.maxStringLength;

  const seen = new Map<object, string>();

  function truncateString(s: string): string {
    if (s.length <= maxStringLength) return s;
    return s.slice(0, maxStringLength) + `…(+${s.length - maxStringLength})`;
  }

  function encode(v: unknown, depth: number, path: string): EncodedValue {
    if (v === null) return null;
    if (v === undefined) return { __ndt_type: "undefined" };

    const t = typeof v;
    if (t === "boolean") return v as boolean;
    if (t === "number") {
      const n = v as number;
      if (Number.isNaN(n)) return "NaN";
      if (n === Infinity) return "Infinity";
      if (n === -Infinity) return "-Infinity";
      return n;
    }
    if (t === "string") return truncateString(v as string);
    if (t === "bigint")
      return { __ndt_type: "bigint", value: (v as bigint).toString() };
    if (t === "symbol")
      return {
        __ndt_type: "symbol",
        description: (v as symbol).description ?? null,
      };
    if (t === "function")
      return {
        __ndt_type: "function",
        name: (v as { name?: string }).name ?? "anonymous",
      };

    // object-like
    const obj = v as object;
    if (seen.has(obj)) {
      return { __ndt_type: "ref", path: seen.get(obj)! };
    }
    seen.set(obj, path);

    if (v instanceof Date)
      return { __ndt_type: "date", value: v.toISOString() };
    if (v instanceof RegExp)
      return { __ndt_type: "regexp", source: v.source, flags: v.flags };
    if (v instanceof Error) {
      const out: {
        __ndt_type: "error";
        name: string;
        message: string;
        stack?: string;
      } = {
        __ndt_type: "error",
        name: v.name,
        message: v.message,
      };
      if (v.stack !== undefined) out.stack = v.stack;
      return out;
    }
    if (v instanceof Map) {
      if (depth >= maxDepth)
        return { __ndt_type: "object", entries: [], truncated: true };
      const entries: Array<[EncodedValue, EncodedValue]> = [];
      let i = 0;
      for (const [k, val] of v) {
        if (i++ >= maxObjectKeys) {
          return {
            __ndt_type: "map",
            entries,
            ...({ truncated: true } as object),
          } as EncodedValue;
        }
        entries.push([
          encode(k, depth + 1, `${path}.key${i}`),
          encode(val, depth + 1, `${path}[${i}]`),
        ]);
      }
      return { __ndt_type: "map", entries };
    }
    if (v instanceof Set) {
      if (depth >= maxDepth) return { __ndt_type: "set", values: [] };
      const values: EncodedValue[] = [];
      let i = 0;
      for (const item of v) {
        if (i++ >= maxArrayLength) {
          return {
            __ndt_type: "set",
            values,
            ...({ truncated: true } as object),
          } as EncodedValue;
        }
        values.push(encode(item, depth + 1, `${path}[${i}]`));
      }
      return { __ndt_type: "set", values };
    }
    if (Array.isArray(v)) {
      if (depth >= maxDepth)
        return { __ndt_type: "array", items: [], truncated: true };
      const items: EncodedValue[] = [];
      const len = Math.min(v.length, maxArrayLength);
      const truncated = v.length > maxArrayLength;
      for (let i = 0; i < len; i++) {
        items.push(encode(v[i], depth + 1, `${path}[${i}]`));
      }
      return truncated
        ? { __ndt_type: "array", items, truncated: true }
        : { __ndt_type: "array", items };
    }

    // plain object
    if (depth >= maxDepth)
      return { __ndt_type: "object", entries: [], truncated: true };
    const keys = Object.keys(v as object);
    const entries: Array<[string, EncodedValue]> = [];
    const len = Math.min(keys.length, maxObjectKeys);
    const truncated = keys.length > maxObjectKeys;
    for (let i = 0; i < len; i++) {
      const key = keys[i]!;
      try {
        entries.push([
          key,
          encode(
            (v as Record<string, unknown>)[key],
            depth + 1,
            `${path}.${key}`,
          ),
        ]);
      } catch {
        entries.push([
          key,
          {
            __ndt_type: "error",
            name: "EncodeError",
            message: "failed to encode",
          },
        ]);
      }
    }
    return truncated
      ? { __ndt_type: "object", entries, truncated: true }
      : { __ndt_type: "object", entries };
  }

  try {
    return encode(value, 0, "$");
  } catch {
    return {
      __ndt_type: "error",
      name: "EncodeError",
      message: "top-level encode failed",
    };
  }
}

export function decodeValue(encoded: EncodedValue): unknown {
  if (encoded === null) return null;
  if (
    typeof encoded === "boolean" ||
    typeof encoded === "number" ||
    typeof encoded === "string"
  ) {
    // note: NaN/Infinity encoded as strings are returned as strings (lossy marker)
    return encoded;
  }
  if (typeof encoded !== "object") return encoded;

  const e = encoded as { __ndt_type?: string };
  if (!e.__ndt_type) return encoded;

  switch (e.__ndt_type) {
    case "undefined":
      return undefined;
    case "bigint":
      return BigInt((e as { value: string }).value);
    case "date":
      return new Date((e as { value: string }).value);
    case "error": {
      const er = e as { name: string; message: string; stack?: string };
      const err = new Error(er.message);
      err.name = er.name;
      if (er.stack) err.stack = er.stack;
      return err;
    }
    case "regexp": {
      const r = e as { source: string; flags: string };
      return new RegExp(r.source, r.flags);
    }
    case "map": {
      const m = e as { entries: Array<[EncodedValue, EncodedValue]> };
      return new Map(
        m.entries.map(([k, v]) => [decodeValue(k), decodeValue(v)]),
      );
    }
    case "set": {
      const s = e as { values: EncodedValue[] };
      return new Set(s.values.map(decodeValue));
    }
    case "array": {
      const a = e as { items: EncodedValue[] };
      return a.items.map(decodeValue);
    }
    case "object": {
      const o = e as { entries: Array<[string, EncodedValue]> };
      const out: Record<string, unknown> = {};
      for (const [k, v] of o.entries) out[k] = decodeValue(v);
      return out;
    }
    case "ref":
      return undefined; // cannot resolve across boundary
    case "function":
      return undefined;
    case "symbol":
      return Symbol(
        (e as { description: string | null }).description ?? undefined,
      );
    default:
      return encoded;
  }
}
