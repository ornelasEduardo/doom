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
