## 2024-05-24 - Table Performance Anti-pattern
**Learning:** `useReactTable` from TanStack Table v8 requires referentially stable options to avoid unnecessary re-computations. Passing a new object literal or calling factory functions (like `getFacetedUniqueValues()`) directly in the hook arguments breaks stability.
**Action:** Always memoize the options object with `useMemo` and define factory functions outside the component or memoize them.
