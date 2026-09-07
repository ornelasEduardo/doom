import type { Scale } from "../types/scales";

export function isSampleValue(value: unknown): value is string | number {
  return (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function numericSample(value: unknown): number | undefined {
  if (!isSampleValue(value) || (typeof value === "string" && !value.trim())) {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function sampleCoordinate(value: unknown, scale: Scale): number | undefined {
  if (!isSampleValue(value)) {
    return undefined;
  }
  const input = "invert" in scale ? numericSample(value) : value;
  if (input === undefined) {
    return undefined;
  }
  const coordinate = (scale as (value: string | number) => number | undefined)(
    input,
  );
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

/** Validate before scaling: D3's numeric coercion would turn null into zero. */
export function samplePosition<T>(
  datum: T | null | undefined,
  getX: (datum: T) => unknown,
  getY: (datum: T) => unknown,
  xScale: Scale,
  yScale: Scale,
): { x: number; y: number } | null {
  if (datum == null) {
    return null;
  }
  const x = sampleCoordinate(getX(datum), xScale);
  const y = sampleCoordinate(getY(datum), yScale);
  return x === undefined || y === undefined ? null : { x, y };
}
