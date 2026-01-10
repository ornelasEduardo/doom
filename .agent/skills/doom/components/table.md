# Table Component

## Import

```tsx
import { Table } from "doom-design-system";
import { ColumnDef } from "@tanstack/react-table";
```

## Props

| Prop                      | Type                                   | Default      | Description                                |
| ------------------------- | -------------------------------------- | ------------ | ------------------------------------------ |
| `data`                    | `T[]`                                  | required     | Array of row data                          |
| `columns`                 | `ColumnDef<T>[]`                       | required     | TanStack column definitions                |
| `enablePagination`        | `boolean`                              | `true`       | Enable pagination controls                 |
| `enableFiltering`         | `boolean`                              | `true`       | Enable global search                       |
| `enableColumnFilters`     | `boolean`                              | `true`       | Enable per-column filters                  |
| `enableSorting`           | `boolean`                              | `true`       | Enable column sorting                      |
| `enableVirtualization`    | `boolean`                              | `false`      | Virtualize rows for large datasets         |
| `enableAdvancedFiltering` | `boolean`                              | `false`      | Enable FilterBuilder UI                    |
| `pageSize`                | `number`                               | `10`         | Default rows per page                      |
| `height`                  | `string \| number`                     | —            | Fixed height (required for virtualization) |
| `variant`                 | `"default" \| "flat"`                  | `"default"`  | Visual style                               |
| `density`                 | `"compact" \| "standard" \| "relaxed"` | `"standard"` | Row padding                                |
| `striped`                 | `boolean`                              | `false`      | Alternating row colors                     |
| `filters`                 | `FilterConfig[]`                       | —            | Filter definitions for advanced filtering  |
| `toolbarContent`          | `ReactNode`                            | —            | Custom toolbar content                     |

## Column Definition

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
  },
  {
    accessorKey: "email",
    header: "Email",
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
<Table
  data={users}
  columns={columns}
  enablePagination
  enableSorting
  density="compact"
/>
```

## Advanced Filtering

```tsx
<Table
  data={orders}
  columns={columns}
  enableAdvancedFiltering
  filters={[
    { columnId: "status", label: "Status", type: "select", options: [...] },
    { columnId: "amount", label: "Amount", type: "number", operators: ["eq", "gt", "lt"] },
  ]}
/>
```

## Guidelines

- Use `enableVirtualization` for 500+ rows (set `height` when using).
- Use `enableAdvancedFiltering` to replace simple column filters with FilterBuilder.
- Provide `filters` array to define filterable columns with their types/operators.
