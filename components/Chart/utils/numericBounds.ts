export function numericBounds(
  values: Iterable<number>,
): [number, number] | undefined {
  let min = Infinity,
    max = -Infinity;
  for (const value of values) {
    if (Number.isFinite(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return min === Infinity ? undefined : [min, max];
}
