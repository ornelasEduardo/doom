import { Accessor } from "../types";
import { resolveAccessor } from "./accessors";

const formatValue = (value: unknown): string =>
  value instanceof Date ? value.toLocaleDateString() : String(value);

/**
 * A human-readable name for a single datum, built from the chart's own
 * accessors.
 *
 * Marks previously used `JSON.stringify(datum)` as their accessible name, which
 * reads the entire row aloud — internal ids, nested metadata and all. Only the
 * values the chart actually plots belong in the accessible name.
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
