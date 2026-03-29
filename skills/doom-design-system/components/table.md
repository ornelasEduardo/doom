# Table

## Import
```tsx
import { Table } from "doom-design-system";
import type { ColumnDef } from "@tanstack/react-table";
```

Peer dependency: `npm install @tanstack/react-table`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Array of row data |
| `columns` | `(string \| ColumnDef<T>)[]` | required | Column definitions — strings auto-convert to simple columns |
| `enablePagination` | `boolean` | `true` | Enable pagination controls |
| `enableFiltering` | `boolean` | `true` | Enable global search (case-insensitive substring match) |
| `enableColumnFilters` | `boolean` | `true` | Enable per-column filter dropdowns in headers |
| `enableSorting` | `boolean` | `true` | Enable column sorting (click headers) |
| `enableVirtualization` | `boolean` | `false` | Virtualize rows with `@tanstack/react-virtual` |
| `enableAdvancedFiltering` | `boolean` | `false` | Enable nested FilterBuilder UI |
| `pageSize` | `number` | `10` | Default rows per page |
| `height` | `string \| number` | `400` | Fixed height (required when virtualization is on) |
| `maxHeight` | `string \| number` | — | Max height with sticky header |
| `variant` | `"default" \| "flat"` | `"default"` | Visual style |
| `density` | `"compact" \| "standard" \| "relaxed"` | `"standard"` | Row padding |
| `striped` | `boolean` | `false` | Alternating row colors |
| `filters` | `FilterConfig[]` | — | Filter field definitions for advanced filtering |
| `onAdvancedFilterChange` | `(value: FilterGroupItem) => void` | — | Callback when advanced filter changes |
| `toolbarContent` | `ReactNode` | — | Custom toolbar content |
| `className` | `string` | — | CSS class name |
| `style` | `CSSProperties` | — | Inline styles |

## Column Definition

Columns accept either strings or full TanStack `ColumnDef` objects:

```tsx
// Simple — string columns auto-convert to { accessorKey, header }
<Table data={users} columns={["name", "email", "role"]} />

// Full control with ColumnDef
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <Badge>{getValue()}</Badge>,
  },
];
```

## FilterConfig

Used with `enableAdvancedFiltering` and the `filters` prop:

```tsx
interface FilterConfig {
  columnId: string;
  label: string;
  type?: "select" | "text" | "number";
  options?: { value: string; label: string }[];
  operators?: FilterOperatorKey[];
}
```

Available operators: `eq`, `neq`, `contains`, `startsWith`, `endsWith`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `isEmpty`, `isNotEmpty`

## Advanced Filtering

The FilterBuilder provides a nested filter UI with:
- AND/OR logic groups
- Drag-and-drop reordering of conditions
- Nested groups up to 3 levels deep (`MAX_DEPTH = 3`)
- Per-column filter dropdowns that auto-generate options from column data via `getFacetedUniqueValues`

```tsx
<Table
  data={orders}
  columns={columns}
  enableAdvancedFiltering
  filters={[
    { columnId: "status", label: "Status", type: "select", options: statusOptions },
    { columnId: "amount", label: "Amount", type: "number", operators: ["eq", "gt", "lt", "gte", "lte"] },
    { columnId: "name", label: "Customer", type: "text" },
  ]}
  onAdvancedFilterChange={(filterGroup) => console.log(filterGroup)}
/>
```

## Usage

```tsx
// Basic table
<Table data={users} columns={columns} enablePagination enableSorting density="compact" />

// Large dataset with virtualization
<Table data={bigData} columns={columns} enableVirtualization height={600} />

// Pagination page size selector offers: 10, 20, 50, 100 rows
```

## Notes
- TanStack Table is a peer dependency — install separately
- The component manages its own `useReactTable` instance internally — pass `data` and `columns`, not a table instance
- **Virtualization and pagination are mutually exclusive** — enabling virtualization hides pagination controls
- Set `height` when using `enableVirtualization` (defaults to 400px)
- Use `enableVirtualization` for 500+ rows (uses `@tanstack/react-virtual` with 5-item overscan)
- Sort indicators: arrow-up for ascending, arrow-down for descending
- Empty state shows "No results found." (not customizable)
- Column header filter dropdowns support multiple selections per column, with selected values sorted first
