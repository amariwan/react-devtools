import type { EncodedValue } from "@next-devtools/contracts";

/**
 * Display metadata for an encoded value. The codec (value-codec.ts) already
 * handles depth, cycles, and collection truncation; these helpers only decide
 * how a value is presented and whether it can be expanded into child rows.
 */

export type ValueKind =
  | "null"
  | "undefined"
  | "boolean"
  | "number"
  | "string"
  | "bigint"
  | "date"
  | "regexp"
  | "error"
  | "symbol"
  | "function"
  | "array"
  | "map"
  | "set"
  | "object"
  | "ref";

export interface ValueSummary {
  kind: ValueKind;
  /** Short inline representation, e.g. `42`, `"abc"`, `Array(3)`. */
  label: string;
  /** Whether the value can be expanded into child rows. */
  expandable: boolean;
}

export interface ValueChild {
  key: string;
  value: EncodedValue;
}

export function summarizeValue(value: EncodedValue): ValueSummary {
  if (value === null) return { kind: "null", label: "null", expandable: false };
  if (typeof value === "boolean")
    return {
      kind: "boolean",
      label: value ? "true" : "false",
      expandable: false,
    };
  if (typeof value === "number")
    return { kind: "number", label: String(value), expandable: false };
  if (typeof value === "string")
    return { kind: "string", label: JSON.stringify(value), expandable: false };

  switch (value.__ndt_type) {
    case "undefined":
      return { kind: "undefined", label: "undefined", expandable: false };
    case "bigint":
      return { kind: "bigint", label: `${value.value}n`, expandable: false };
    case "date":
      return { kind: "date", label: value.value, expandable: false };
    case "regexp":
      return {
        kind: "regexp",
        label: `/${value.source}/${value.flags}`,
        expandable: false,
      };
    case "error":
      return {
        kind: "error",
        label: `${value.name}: ${value.message}`,
        expandable: false,
      };
    case "symbol":
      return {
        kind: "symbol",
        label:
          value.description === null
            ? "Symbol()"
            : `Symbol(${value.description})`,
        expandable: false,
      };
    case "function":
      return {
        kind: "function",
        label: `ƒ ${value.name}()`,
        expandable: false,
      };
    case "array":
      return {
        kind: "array",
        label: `Array(${value.items.length})`,
        expandable: value.items.length > 0,
      };
    case "map":
      return {
        kind: "map",
        label: `Map(${value.entries.length})`,
        expandable: value.entries.length > 0,
      };
    case "set":
      return {
        kind: "set",
        label: `Set(${value.values.length})`,
        expandable: value.values.length > 0,
      };
    case "object":
      return {
        kind: "object",
        label: `{${value.entries.length}}`,
        expandable: value.entries.length > 0,
      };
    case "ref":
      return { kind: "ref", label: `↻ ${value.path}`, expandable: false };
    default:
      return { kind: "object", label: "…", expandable: false };
  }
}

/** Child rows for an expandable value, or an empty array for primitives. */
export function childrenOf(value: EncodedValue): ValueChild[] {
  if (typeof value !== "object" || value === null) return [];
  switch (value.__ndt_type) {
    case "array":
      return value.items.map((item, i) => ({ key: String(i), value: item }));
    case "map":
      return value.entries.map(([k, v]) => ({
        key: summarizeValue(k).label,
        value: v,
      }));
    case "set":
      return value.values.map((item, i) => ({ key: String(i), value: item }));
    case "object":
      return value.entries.map(([k, v]) => ({ key: k, value: v }));
    default:
      return [];
  }
}
