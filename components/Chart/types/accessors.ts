// =============================================================================
// ACCESSOR TYPES - Enables string accessors for great DX
// =============================================================================

/**
 * Accessor can be a string key (for direct property access) or a function.
 * String accessors provide excellent DX: x="month" instead of x={(d) => d.month}
 */
export type Accessor<T, R> = keyof T | ((d: T) => R);

/**
 * Resolves an accessor to a function. If it's a string, returns a property accessor.
 */
export function resolveAccessor<T, R>(accessor: Accessor<T, R>): (d: T) => R {
  if (typeof accessor === "function") {
    return accessor;
  }
  return (d: T) => d[accessor] as R;
}
