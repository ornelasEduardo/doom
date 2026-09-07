// =============================================================================
// ACCESSOR TYPES - Enables string accessors for great DX
// =============================================================================

/**
 * Accessor accepts keys whose values satisfy R, or a function returning R.
 * String accessors provide excellent DX: x="month" instead of x={(d) => d.month}
 */
export type Accessor<T, R> =
  | keyof { [K in keyof T as T[K] extends R ? K : never]: R }
  | ((d: T) => R);

/** Axis samples may be missing; size accessors keep their numeric contract. */
export type AxisValue = string | number | null | undefined;

/**
 * Resolves an accessor to a function. If it's a string, returns a property accessor.
 */
export function resolveAccessor<T, R>(accessor: Accessor<T, R>): (d: T) => R {
  if (typeof accessor === "function") {
    return accessor;
  }
  return (d: T) => d[accessor] as R;
}
