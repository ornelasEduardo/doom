# Pagination

## Import
```tsx
import { Pagination } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | required | Current active page (1-indexed) |
| `totalPages` | `number` | required | Total number of pages |
| `onPageChange` | `(page: number) => void` | required | Page change callback |

## Usage

```tsx
// Basic pagination
<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPageChange={setPage}
/>
```

## Notes
- Pages are 1-indexed — first page is `1`, not `0`
- Prev/Next buttons are automatically disabled at boundaries (page 1 and last page)
- Automatically truncates with ellipsis for large page counts
- Used internally by `Table` when `enablePagination` is true — avoid double-rendering
