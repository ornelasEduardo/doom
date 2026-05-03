# Filter (lib)

Two-tier API at `doom-design-system/filter`. The headless layer (AST + evaluator) and the doom-styled UI components ship from the same subpath. Consumers using only the headless layer don't bundle React UI bytes — tree-shaking handles the separation.

## Headless layer

For consumers who roll their own filter UI, build server-side queries, sync URL state, or evaluate filters outside React.

### Import

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

### The `Filter` type

A `Filter` is a recursive tree of conditions and nested groups. Treated as **immutable** — the public types are marked `readonly`. Produce a new `Filter` rather than mutating in place. Pair with `FilterDraft` (below) when you need an editable working copy.

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

`logic` joins a node with its previous sibling. The first sibling's `logic` is ignored. Omitted defaults to `"and"`.

### Operators

```ts
type FilterOperatorKey =
  | "eq" | "neq" | "contains" | "startsWith" | "endsWith"
  | "gt" | "gte" | "lt" | "lte"
  | "in" | "notIn" | "isEmpty" | "isNotEmpty";
```

`OPERATORS` is a frozen record mapping each key to a `{ key, label, fn }` definition. `fn(cellValue, filterValue) => boolean` is the evaluation function.

### `evaluateFilter(filter, row)`

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

### `simpleFiltersToFilter(selections)`

Convenience for `{ field: value }` maps. Returns `null` when nothing selected.

### `arrayIncludesFilter`

A `FilterFn` for `@tanstack/react-table` — matches when a column value appears in the supplied filter array. String comparison.

## UI layer

For consumers who want the pre-built doom-styled FilterBuilder.

### Import

```tsx
import {
  FilterBuilder,
  draftToFilter,
  filterToDraft,
  type FilterField,
  type FilterDraft,
  type FilterDraftGroup,
} from "doom-design-system/filter";
```

### `FilterDraft` vs `Filter`

`FilterDraft` is the **editable** working copy used by the UI. It mirrors `Filter` structurally with three differences:

- `id` is required (React keys, dnd identifiers)
- `value` is always a string (form input compatibility)
- Groups have a `collapsed?: boolean` flag and use `children[]` instead of `conditions[]`

Lifecycle: load a `Filter` → convert to `FilterDraft` → user edits → convert back to `Filter` → evaluate.

### `<FilterBuilder>`

```tsx
const fields: FilterField[] = [
  { key: "status", label: "Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ]},
  { key: "name", label: "Name", type: "text" },
];

const [draft, setDraft] = useState<FilterDraftGroup | null>(null);

<FilterBuilder fields={fields} value={draft} onChange={setDraft} />

// On apply:
const filter = draft ? draftToFilter(draft) : null;
```

### Conversion

```ts
draftToFilter(draft: FilterDraft): Filter   // strips UI fields, freezes shape
filterToDraft(filter: Filter): FilterDraft  // generates IDs, deep-clones into mutable
```

### Lower-level UI primitives

For custom layouts that need the building blocks rather than the full `FilterBuilder`:

| Export | Purpose |
|--------|---------|
| `FilterGroupView` | The group-level view (recursive nested groups, collapse, dnd). Renamed from `FilterGroup` to avoid collision with the AST type. |
| `ConditionRow` | A single condition editor row with field/operator/value selects |
| `FilterConditionRow` | Simpler row variant for non-nested filter builders |
| `FilterSheetNested` | The full sheet wrapper with DnDContext setup (used internally by `FilterBuilder`) |

## Patterns

### URL state sync

`Filter` is JSON-serializable as long as `value` is JSON-safe. Round-trip through `JSON.stringify` / `JSON.parse` for URL persistence.

### Server-side translation

Walk the tree once and emit your backend's query language (SQL `WHERE`, MongoDB `$expr`). Each `FilterCondition` is a leaf; each `FilterGroup` joins by `logic`.

### Custom UI

Build any UI you want on top of `Filter`. The `FilterBuilder` is one consumer of the AST — yours can be different. Treat the AST as the source of truth and convert to your editor's working state when editing.
