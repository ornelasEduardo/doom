export const MIN_TICK_GAP = 8;

interface TickSource<T> {
  domain: () => T[];
  ticks?: (count: number) => T[];
}

const limitTicks = <T>(values: T[], limit: number): T[] => {
  if (values.length <= limit) {
    return values;
  }
  if (limit === 1) {
    return values.slice(0, 1);
  }
  return Array.from(
    { length: limit },
    (_, i) => values[Math.round((i * (values.length - 1)) / (limit - 1))],
  );
};

/** Shared candidate positions for axes and grid lines, before label collision removal. */
export function getAxisTicks<T>(
  scale: TickSource<T>,
  length: number,
  requested: number | undefined,
  defaultCount: number,
) {
  const maxTicks =
    requested !== undefined && Number.isFinite(requested) && requested >= 1
      ? Math.floor(requested)
      : undefined;
  // Cap generation before D3 allocates ticks, not only after labels render.
  const displayBudget = Math.max(
    1,
    Math.floor((Number.isFinite(length) ? length : 0) / MIN_TICK_GAP),
  );
  let count =
    maxTicks === undefined ? defaultCount : Math.min(maxTicks, displayBudget);
  let candidates = scale.ticks ? scale.ticks(count) : scale.domain();
  const limit =
    maxTicks === undefined ? undefined : Math.min(maxTicks, displayBudget);
  // Continuous ticks should keep D3's regular intervals, rather than develop
  // gaps from sampling individual values out of an otherwise uniform grid.
  while (
    scale.ticks &&
    limit !== undefined &&
    candidates.length > limit &&
    count > 1
  ) {
    count = Math.max(
      1,
      Math.min(count - 1, Math.floor((count * limit) / candidates.length)),
    );
    candidates = scale.ticks(count);
  }
  const values =
    limit === undefined ? candidates : limitTicks(candidates, limit);
  return { values, count, maxTicks };
}
