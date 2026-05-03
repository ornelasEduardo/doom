import { Filter, FilterCondition } from "./types";

/**
 * Convenience helper that converts a flat `{ field: value }` map to a Filter
 * tree using equality operators joined by AND. Returns null when no
 * non-empty values are present.
 */
export function simpleFiltersToFilter(
  selections: Record<string, string>,
): Filter | null {
  const conditions: FilterCondition[] = Object.entries(selections)
    .filter(([, value]) => value !== "" && value != null)
    .map(([field, value], index) => ({
      type: "condition" as const,
      field,
      operator: "eq" as const,
      value,
      logic: index > 0 ? ("and" as const) : undefined,
    }));

  if (conditions.length === 0) {
    return null;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    type: "group",
    conditions,
  };
}
