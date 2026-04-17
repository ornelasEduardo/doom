import { resolveAccessor } from "./accessors";
import { Series } from "../types";

/**
 * Returns the cumulative value-axis offset for a bar in a stack.
 * Sum of all preceding series' values for the same category.
 *
 * Series in the same stack are matched by stackId and ordered by their
 * registration position in processedSeries.
 */
export function getStackOffset(
  series: Series,
  datum: any,
  processedSeries: Series[],
): number {
  if (!series.stackId) return 0;

  const categoryAccessor = series.categoryAccessor
    ? resolveAccessor(series.categoryAccessor)
    : null;
  if (!categoryAccessor) return 0;

  const datumCategory = categoryAccessor(datum);
  let offset = 0;

  for (const other of processedSeries) {
    if (other.id === series.id) break;
    if (other.stackId !== series.stackId) continue;
    if (!other.data || !other.valueAccessor || !other.categoryAccessor) continue;

    const otherCategoryAccessor = resolveAccessor(other.categoryAccessor);
    const otherValueAccessor = resolveAccessor(other.valueAccessor);

    const match = other.data.find((d) => otherCategoryAccessor(d) === datumCategory);
    if (match !== undefined) {
      const v = otherValueAccessor(match);
      if (typeof v === "number") offset += v;
    }
  }

  return offset;
}

/**
 * Computes the maximum stacked total across all categories for any stack
 * present in processedSeries. Used to size the value-axis domain.
 *
 * Returns 0 if no series are stacked.
 */
export function getMaxStackedValue(processedSeries: Series[]): number {
  const stackIds = new Set<string>();
  for (const s of processedSeries) {
    if (s.stackId) stackIds.add(s.stackId);
  }
  if (stackIds.size === 0) return 0;

  let maxTotal = 0;

  for (const stackId of stackIds) {
    const stackSeries = processedSeries.filter((s) => s.stackId === stackId);
    const totalsByCategory = new Map<unknown, number>();

    for (const s of stackSeries) {
      if (!s.data || !s.valueAccessor || !s.categoryAccessor) continue;
      const valueAccessor = resolveAccessor(s.valueAccessor);
      const categoryAccessor = resolveAccessor(s.categoryAccessor);

      for (const d of s.data) {
        const v = valueAccessor(d);
        if (typeof v !== "number") continue;
        const cat = categoryAccessor(d);
        totalsByCategory.set(cat, (totalsByCategory.get(cat) ?? 0) + v);
      }
    }

    for (const total of totalsByCategory.values()) {
      if (total > maxTotal) maxTotal = total;
    }
  }

  return maxTotal;
}
