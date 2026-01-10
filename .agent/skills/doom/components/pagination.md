# Pagination Component

## Import

```tsx
import { Pagination } from "doom-design-system";
```

## Props

| Prop           | Type                     | Description                     |
| -------------- | ------------------------ | ------------------------------- |
| `currentPage`  | `number`                 | Current active page (1-indexed) |
| `totalPages`   | `number`                 | Total number of pages           |
| `onPageChange` | `(page: number) => void` | Page change callback            |

## Usage

```tsx
<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPageChange={setPage}
/>
```

## Guidelines

- Pages are 1-indexed.
- Automatically truncates with ellipsis for large page counts.
- Prev/Next buttons are disabled at boundaries.
- Used internally by Table component when `enablePagination` is true.
