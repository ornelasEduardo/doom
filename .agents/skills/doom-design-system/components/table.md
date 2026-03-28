# Table

## Import
```tsx
import { Table } from "doom-design-system";
import { ColumnDef, useReactTable, getCoreRowModel } from "@tanstack/react-table";
```

Peer dependency: `npm install @tanstack/react-table`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Array of row data |
| `columns` | `ColumnDef<T>[]` | required | TanStack column definitions |
| `enablePagination` | `boolean` | `true` | Enable pagination controls |
| `enableFiltering` | `boolean` | `true` | Enable global search |
| `enableColumnFilters` | `boolean` | `true` | Enable per-column filters |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enableVirtualization` | `boolean` | `false` | Virtualize rows (for large datasets) |
| `enableAdvancedFiltering` | `boolean` | `false` | Enable FilterBuilder UI |
| `pageSize` | `number` | `10` | Default rows per page |
| `height` | `string \| number` | — | Fixed height with sticky header |
| `maxHeight` | `string \| number` | — | Max height with sticky header |
| `variant` | `"default" \| "flat"` | `"default"` | Visual style |
| `density` | `"compact" \| "standard" \| "relaxed"` | `"standard"` | Row padding |
| `striped` | `boolean` | `false` | Alternating row colors |
| `filters` | `FilterConfig[]` | — | Filter definitions for advanced filtering |
| `toolbarContent` | `ReactNode` | — | Custom toolbar content |

## Column Definition

```tsx
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

## Usage

```tsx
// Basic table
<Table data={users} columns={columns} enablePagination enableSorting density="compact" />

// Advanced filtering
<Table
  data={orders}
  columns={columns}
  enableAdvancedFiltering
  filters={[
    { columnId: "status", label: "Status", type: "select", options: [...] },
    { columnId: "amount", label: "Amount", type: "number", operators: ["eq", "gt", "lt"] },
  ]}
/>

// Large dataset with virtualization
<Table data={bigData} columns={columns} enableVirtualization height={600} />
```

## Notes
- TanStack Table is a peer dependency — install separately: `npm install @tanstack/react-table`
- The component manages its own `useReactTable` instance internally — pass `data` and `columns`, not a table instance
- Set `height` when using `enableVirtualization` — required for virtual scroll to work
- Use `enableVirtualization` for 500+ rows
- `enableAdvancedFiltering` replaces simple column filters with a full FilterBuilder UI; provide `filters` array to define filterable columns
