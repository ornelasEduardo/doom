import { Accessor } from "../types";
import { resolveAccessor } from "./accessors";

const formatValue = (value: unknown): string =>
  value instanceof Date ? value.toLocaleDateString() : String(value);

/**
 * A human-readable name for a single datum, built from the chart's own
 * accessors. Only the values the chart plots belong in an accessible name —
 * not the whole row.
 */
export const describeDatum = (
  datum: unknown,
  x?: Accessor<any, any>,
  y?: Accessor<any, any>,
): string => {
  if (datum === null || datum === undefined) {
    return "";
  }

  const parts: string[] = [];

  for (const accessor of [x, y]) {
    if (!accessor) {
      continue;
    }
    try {
      const value = resolveAccessor(accessor as any)(datum as any);
      if (value !== undefined && value !== null) {
        parts.push(formatValue(value));
      }
    } catch {
      // A mismatched accessor should not break the accessible name.
    }
  }

  return parts.join(": ");
};
