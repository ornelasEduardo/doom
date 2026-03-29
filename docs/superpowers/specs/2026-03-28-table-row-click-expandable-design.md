# Table: Row Click & Expandable Rows

## Goal

Add two features to the Table component: clickable rows (`onRowClick`) and expandable rows (`renderExpandedRow`).

## New Props

### `onRowClick`

```tsx
onRowClick?: (row: Row<T>, e: React.MouseEvent) => void
```

- Attaches a click handler to each `<tr>` in both StandardTableBody and VirtualTableBody
- Passes TanStack's `Row<T>` object (consumer accesses raw data via `row.original`)
- Passes the native mouse event for target inspection
- Rows get `cursor: pointer` styling when this prop is provided
- Does NOT fire when the click target is the expand chevron (see interaction below)

### `renderExpandedRow`

```tsx
renderExpandedRow?: (row: Row<T>) => React.ReactNode | null
```

- When provided, a chevron column is auto-prepended to the columns array
- Chevron is a small rotate-on-expand icon (0° collapsed, 90° expanded)
- If the function returns `null` for a given row, no chevron is rendered for that row
- Clicking the chevron toggles expansion via TanStack's built-in expanding row model
- Expanded content renders in a `<tr>` immediately after the data row, with a single `<td colSpan={totalColumns}>` spanning full width
- Internal `expanded` state is managed by TanStack Table (`getExpandedRowModel`) — no controlled prop needed
- Works with both standard and virtualized rendering paths

## Interaction Between Features

- `onRowClick` must NOT fire when the expand chevron is clicked. The chevron click handler calls `e.stopPropagation()` to prevent this.
- Both features can be used independently or together.

## Implementation Details

### Table.tsx Changes

1. **Props**: Add `onRowClick` and `renderExpandedRow` to `TableProps<T>`.

2. **TanStack config**: Import `getExpandedRowModel` from `@tanstack/react-table`. Add `expanded` to internal state. Pass `getExpandedRowModel` to `useReactTable` when `renderExpandedRow` is provided.

3. **Column prepend**: When `renderExpandedRow` is provided, prepend an expand toggle column to the normalized columns array. The column renders:
   - A chevron button if `renderExpandedRow(row)` would return non-null content
   - Nothing if it returns `null`
   - The chevron button calls `row.toggleExpanded()` and `e.stopPropagation()`

4. **Row rendering (both paths)**:
   - Add `onClick` handler to `<tr>` when `onRowClick` is provided
   - Add `cursor: pointer` class when `onRowClick` is provided
   - After each data `<tr>`, if the row is expanded (`row.getIsExpanded()`), render an additional `<tr>` with a single `<td colSpan={columns.length}>` containing the result of `renderExpandedRow(row)`

5. **VirtualTableBody**: Expanded rows need to be accounted for in the virtualizer's item count and measurement. Each expanded row is an additional virtual item.

### Table.module.scss Changes

- `.clickable` — `cursor: pointer` on `<tr>`
- `.expandToggle` — chevron button styling (small, centered, no border)
- `.expandToggleIcon` — rotation transition (0° → 90°)
- `.expandedRow` — full-width expanded content row, background matches card-bg, optional subtle top border

### Stories

Add stories demonstrating:
- `onRowClick` with a toast or console action
- Expandable rows with custom content (detail panel)
- Combined: clickable rows with expandable detail
- Mixed: some rows expandable, others not (return `null`)

### Tests

- `onRowClick` fires with correct row data on click
- `onRowClick` does NOT fire when clicking the expand chevron
- Expand toggle shows/hides expanded content
- Rows returning `null` from `renderExpandedRow` show no chevron
- Expanded content spans full table width
- Works with virtualization enabled

## Tech Stack

- TanStack Table `getExpandedRowModel` (already a dependency)
- Lucide `ChevronRight` icon for the expand toggle
- No new dependencies
