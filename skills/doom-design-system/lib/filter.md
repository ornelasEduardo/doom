# Filter (lib)

Headless filter primitives. The same logic that powers the Table FilterBuilder, exposed as a tree-shakeable utility for consumers building custom filter UIs, server-side filtering, URL state, etc.

## Import

```ts
import {
  evaluateFilter,
  simpleFiltersToFilter,
  OPERATORS,
  arrayIncludesFilter,
  type Filter,
  type FilterCondition,
  type FilterGroup,
  type FilterOperatorKey,
} from "doom-design-system/filter";
```

## The `Filter` type

A `Filter` is a recursive tree of conditions and groups. Treated as immutable — the public types are marked `readonly`. Produce a new `Filter` rather than mutating in place.

```ts
type Filter = FilterCondition | FilterGroup;

interface FilterCondition {
  readonly type: "condition";
  readonly id?: string;
  readonly field: string;
  readonly operator: FilterOperatorKey;
  readonly value: unknown;
  readonly logic?: "and" | "or";
}

interface FilterGroup {
  readonly type: "group";
  readonly id?: string;
  readonly conditions: ReadonlyArray<Filter>;
  readonly logic?: "and" | "or";
}
```

`logic` joins a node with its previous sibling. The first sibling's `logic` is ignored (no preceding node to join with). Omitted `logic` defaults to `"and"`.

## Operators

```ts
type FilterOperatorKey =
  | "eq" | "neq" | "contains" | "startsWith" | "endsWith"
  | "gt" | "gte" | "lt" | "lte"
  | "in" | "notIn" | "isEmpty" | "isNotEmpty";
```

`OPERATORS` is a frozen record mapping each key to a `{ key, label, fn }` definition. `fn(cellValue, filterValue) => boolean` is the evaluation function.

## `evaluateFilter(filter, row)`

Returns `true` when the row matches the filter.

```ts
const filter: Filter = {
  type: "group",
  conditions: [
    { type: "condition", field: "status", operator: "eq", value: "active" },
    { type: "condition", field: "age", operator: "gte", value: 18, logic: "and" },
  ],
};

const adults = users.filter((user) => evaluateFilter(filter, user));
```

## `simpleFiltersToFilter(selections)`

Convenience for converting a flat `{ field: value }` map into a Filter using equality operators joined by AND. Returns `null` when no non-empty values are present.

```ts
const filter = simpleFiltersToFilter({ status: "active", role: "admin" });
// → { type: "group", conditions: [
//     { type: "condition", field: "status", operator: "eq", value: "active" },
//     { type: "condition", field: "role", operator: "eq", value: "admin", logic: "and" },
//   ] }
```

## `arrayIncludesFilter`

A `FilterFn` for `@tanstack/react-table` that matches when a row's column value appears in the supplied filter array. Values are compared as strings to support typed columns.

```ts
const columnDef = {
  accessorKey: "status",
  filterFn: arrayIncludesFilter,
};
```

## Patterns

### URL state sync

`Filter` is JSON-serializable as long as `value` is JSON-safe. Round-trip through `JSON.stringify` / `JSON.parse` for URL query string persistence.

### Server-side translation

Walk the tree once and emit your backend's query language (SQL `WHERE`, MongoDB `$expr`, etc). Each `FilterCondition` is a leaf with `{ field, operator, value }`; each `FilterGroup` is a `conditions[]` joined by `logic`.

### Custom UI

Build any UI you want on top of `Filter`. The Table FilterBuilder is one consumer of these primitives — yours can be different. Keep the AST as the source of truth and convert to your UI's working state when editing.
