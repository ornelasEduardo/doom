# Table Row Click & Expandable Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `onRowClick` and `renderExpandedRow` props to the Table component.

**Architecture:** Both features modify the row rendering in `StandardTableBody` and `VirtualTableBody`. `onRowClick` adds a click handler to `<tr>`. `renderExpandedRow` prepends an expand toggle column and renders expanded content in a full-width row below the data row. TanStack Table's `getExpandedRowModel` handles expansion state.

**Tech Stack:** `@tanstack/react-table` (existing), `lucide-react` ChevronRight icon (existing dependency)

---

### Task 1: Add `onRowClick` prop and tests

**Files:**
- Modify: `components/Table/Table.tsx`
- Modify: `components/Table/Table.module.scss`
- Modify: `components/Table/Table.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `components/Table/Table.test.tsx`:

```tsx
describe("onRowClick", () => {
  it("should call onRowClick with row data when a row is clicked", () => {
    const handleRowClick = vi.fn();
    render(
      <Table columns={columns} data={data} onRowClick={handleRowClick} />,
    );

    const firstDataRow = screen.getAllByRole("row")[1];
    fireEvent.click(firstDataRow);

    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick.mock.calls[0][0].original).toEqual({
      id: 1,
      name: "Alice",
      age: 25,
    });
  });

  it("should not error when onRowClick is not provided", () => {
    render(<Table columns={columns} data={data} />);
    const firstDataRow = screen.getAllByRole("row")[1];
    fireEvent.click(firstDataRow);
    // No error thrown
  });

  it("should apply clickable cursor class when onRowClick is provided", () => {
    render(
      <Table
        columns={columns}
        data={data}
        onRowClick={() => {}}
      />,
    );

    const firstDataRow = screen.getAllByRole("row")[1];
    expect(firstDataRow.className).toContain("clickable");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/Table/Table.test.tsx --run`
Expected: FAIL — `onRowClick` prop doesn't exist yet, no `clickable` class

- [ ] **Step 3: Add `onRowClick` to TableProps and BodyProps**

In `components/Table/Table.tsx`, add to `TableProps<T>` interface (after line 89):

```tsx
onRowClick?: (row: import("@tanstack/react-table").Row<T>, e: React.MouseEvent) => void;
```

Add to `BodyProps<T>` interface (after line 96):

```tsx
onRowClick?: (row: import("@tanstack/react-table").Row<T>, e: React.MouseEvent) => void;
```

Import `Row` type at the top alongside existing imports:

```tsx
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  Table as ReactTableInstance,
  useReactTable,
} from "@tanstack/react-table";
```

- [ ] **Step 4: Add `.clickable` class to SCSS**

In `components/Table/Table.module.scss`, add after the `.tr` block (after line 203):

```scss
.clickable {
  cursor: pointer;
}
```

- [ ] **Step 5: Update StandardTableBody to support onRowClick**

Replace the `StandardTableBody` function (lines 170-187) with:

```tsx
function StandardTableBody<T>({ table, striped, density, onRowClick }: BodyProps<T>) {
  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr
          key={row.id}
          className={clsx(styles.tr, striped && styles.striped, onRowClick && styles.clickable, "group")}
          onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
        >
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className={clsx(styles.td, styles[density])}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
```

- [ ] **Step 6: Update VirtualTableBody to support onRowClick**

In the `VirtualTableBody` function, add `onRowClick` to the destructured props (line 103-108):

```tsx
function VirtualTableBody<T>({
  table,
  columns,
  striped,
  density,
  scrollElement,
  onRowClick,
}: VirtualBodyProps<T>) {
```

Update the `<tr>` inside the virtual items map (lines 133-139) to:

```tsx
<tr
  key={row.id}
  ref={rowVirtualizer.measureElement}
  className={clsx(styles.tr, {
    [styles.striped]: striped && virtualRow.index % 2 !== 0,
    [styles.clickable]: !!onRowClick,
  })}
  data-index={virtualRow.index}
  onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
>
```

- [ ] **Step 7: Pass onRowClick through from Table component**

In the `Table` function, destructure `onRowClick` from props (add after line 208):

```tsx
onRowClick,
```

Pass it to both body components. Update the `VirtualTableBody` usage (around line 483):

```tsx
<VirtualTableBody<T>
  columns={normalizedColumns}
  density={density}
  scrollElement={scrollElement}
  striped={striped}
  table={table}
  onRowClick={onRowClick}
/>
```

Update the `StandardTableBody` usage (around line 491):

```tsx
<StandardTableBody<T>
  columns={normalizedColumns}
  density={density}
  striped={striped}
  table={table}
  onRowClick={onRowClick}
/>
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- components/Table/Table.test.tsx --run`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add components/Table/Table.tsx components/Table/Table.module.scss components/Table/Table.test.tsx
git commit -m "feat(table): add onRowClick prop for clickable rows"
```

---

### Task 2: Add `renderExpandedRow` prop and tests

**Files:**
- Modify: `components/Table/Table.tsx`
- Modify: `components/Table/Table.module.scss`
- Modify: `components/Table/Table.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `components/Table/Table.test.tsx`:

```tsx
describe("renderExpandedRow", () => {
  it("should show expand chevron for rows that return content", () => {
    render(
      <Table
        columns={columns}
        data={data}
        renderExpandedRow={(row) =>
          row.original.name === "Alice" ? (
            <div>Alice Details</div>
          ) : null
        }
      />,
    );

    // Alice's row should have a chevron button
    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons).toHaveLength(1);
  });

  it("should toggle expanded content when chevron is clicked", () => {
    render(
      <Table
        columns={columns}
        data={data}
        renderExpandedRow={(row) =>
          row.original.name === "Alice" ? (
            <div data-testid="expanded-alice">Alice Details</div>
          ) : null
        }
      />,
    );

    expect(screen.queryByTestId("expanded-alice")).not.toBeInTheDocument();

    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    expect(screen.getByTestId("expanded-alice")).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(expandButton);
    expect(screen.queryByTestId("expanded-alice")).not.toBeInTheDocument();
  });

  it("should not fire onRowClick when clicking the expand chevron", () => {
    const handleRowClick = vi.fn();
    render(
      <Table
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        renderExpandedRow={(row) =>
          row.original.name === "Alice" ? (
            <div>Alice Details</div>
          ) : null
        }
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it("should render expanded content spanning all columns", () => {
    render(
      <Table
        columns={columns}
        data={data}
        renderExpandedRow={(row) =>
          row.original.name === "Alice" ? (
            <div data-testid="expanded-alice">Alice Details</div>
          ) : null
        }
      />,
    );

    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    // The expanded row should have a td with colSpan = columns + 1 (expand col + data cols)
    const expandedTd = screen.getByTestId("expanded-alice").closest("td");
    expect(expandedTd).toHaveAttribute("colspan", String(columns.length + 1));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/Table/Table.test.tsx --run`
Expected: FAIL — `renderExpandedRow` prop doesn't exist yet

- [ ] **Step 3: Add renderExpandedRow to TableProps and BodyProps**

In `components/Table/Table.tsx`, add to `TableProps<T>` (after the `onRowClick` prop):

```tsx
renderExpandedRow?: (row: Row<T>) => React.ReactNode | null;
```

Add to `BodyProps<T>`:

```tsx
renderExpandedRow?: (row: Row<T>) => React.ReactNode | null;
totalColumns: number;
```

Add to `VirtualBodyProps<T>` — it inherits from `BodyProps<T>` so these are already available.

- [ ] **Step 4: Import getExpandedRowModel and add expanded state**

At the top of `components/Table/Table.tsx`, add `getExpandedRowModel` and `ExpandedState` to the TanStack import:

```tsx
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  Table as ReactTableInstance,
  useReactTable,
} from "@tanstack/react-table";
```

Add `ChevronRight` to the lucide import:

```tsx
import { ChevronRight, Filter, ListFilter, Search } from "lucide-react";
```

Create a hoisted row model (next to the other hoisted models, around line 40):

```tsx
const expandedRowModel = getExpandedRowModel();
```

In the `Table` function, add expanded state (after the other useState calls):

```tsx
const [expanded, setExpanded] = useState<ExpandedState>({});
```

- [ ] **Step 5: Add SCSS styles for expand toggle and expanded row**

In `components/Table/Table.module.scss`, add after the `.clickable` class:

```scss
.expandToggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--spacing-6);
  height: var(--spacing-6);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--on-surface-muted);
  border-radius: var(--radius);
  transition: all var(--duration-fast) var(--ease-in-out);

  &:hover {
    color: var(--on-surface);
    background: color-mix(in srgb, var(--muted-foreground) 15%, transparent);
  }
}

.expandToggleIcon {
  transition: transform var(--duration-fast) var(--ease-in-out);

  &.expanded {
    transform: rotate(90deg);
  }
}

.expandedRow {
  td {
    padding: var(--spacing-4);
    background: color-mix(in srgb, var(--muted-foreground) 5%, transparent);
    border-bottom: 1px solid var(--card-border);
  }
}

.expandCol {
  width: var(--spacing-10);
  padding: var(--spacing-2) !important;
}
```

- [ ] **Step 6: Prepend expand column when renderExpandedRow is provided**

In the `Table` function, after `normalizedColumns` useMemo (around line 278), add:

```tsx
const finalColumns = useMemo(() => {
  if (!renderExpandedRow) return normalizedColumns;

  const expandColumn: ColumnDef<T, unknown> = {
    id: "__expand",
    header: "",
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const content = renderExpandedRow(row);
      if (content === null) return null;
      return (
        <button
          aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
          className={styles.expandToggle}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <ChevronRight
            className={clsx(
              styles.expandToggleIcon,
              row.getIsExpanded() && styles.expanded,
            )}
            size={16}
          />
        </button>
      );
    },
  };

  return [expandColumn, ...normalizedColumns];
}, [normalizedColumns, renderExpandedRow]);
```

Then replace all references to `normalizedColumns` passed to `useReactTable` and body components with `finalColumns`. In `useReactTable` (line 282):

```tsx
columns: finalColumns,
```

- [ ] **Step 7: Add expanded state and getExpandedRowModel to useReactTable**

In the `useReactTable` call, add to the `state` object:

```tsx
state: {
  sorting,
  globalFilter,
  columnFilters,
  pagination,
  expanded,
},
```

Add the handlers and model:

```tsx
onExpandedChange: setExpanded,
getExpandedRowModel: renderExpandedRow ? expandedRowModel : undefined,
```

- [ ] **Step 8: Update StandardTableBody to render expanded rows**

Replace `StandardTableBody` with:

```tsx
function StandardTableBody<T>({
  table,
  striped,
  density,
  onRowClick,
  renderExpandedRow,
  totalColumns,
}: BodyProps<T>) {
  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <React.Fragment key={row.id}>
          <tr
            className={clsx(
              styles.tr,
              striped && styles.striped,
              onRowClick && styles.clickable,
              "group",
            )}
            onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={clsx(
                  styles.td,
                  styles[density],
                  cell.column.id === "__expand" && styles.expandCol,
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
          {row.getIsExpanded() && renderExpandedRow && (
            <tr className={styles.expandedRow}>
              <td colSpan={totalColumns}>
                {renderExpandedRow(row)}
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </tbody>
  );
}
```

- [ ] **Step 9: Update VirtualTableBody to render expanded rows**

Replace the inner map in `VirtualTableBody` (the `rowVirtualizer.getVirtualItems().map(...)` section) with:

```tsx
{rowVirtualizer.getVirtualItems().map((virtualRow) => {
  const row = rows[virtualRow.index];
  return (
    <React.Fragment key={row.id}>
      <tr
        ref={rowVirtualizer.measureElement}
        className={clsx(styles.tr, {
          [styles.striped]: striped && virtualRow.index % 2 !== 0,
          [styles.clickable]: !!onRowClick,
        })}
        data-index={virtualRow.index}
        onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
      >
        {row.getVisibleCells().map((cell) => (
          <td
            key={cell.id}
            className={clsx(
              styles.td,
              styles[`density-${density}`],
              cell.column.id === "__expand" && styles.expandCol,
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {row.getIsExpanded() && renderExpandedRow && (
        <tr className={styles.expandedRow}>
          <td colSpan={totalColumns}>
            {renderExpandedRow(row)}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
})}
```

Update the destructured props in `VirtualTableBody`:

```tsx
function VirtualTableBody<T>({
  table,
  columns,
  striped,
  density,
  scrollElement,
  onRowClick,
  renderExpandedRow,
  totalColumns,
}: VirtualBodyProps<T>) {
```

- [ ] **Step 10: Pass new props through from Table component**

Destructure `renderExpandedRow` from props in the `Table` function.

Compute `totalColumns`:

```tsx
const totalColumns = finalColumns.length;
```

Pass to both body components:

```tsx
<VirtualTableBody<T>
  columns={finalColumns}
  density={density}
  scrollElement={scrollElement}
  striped={striped}
  table={table}
  onRowClick={onRowClick}
  renderExpandedRow={renderExpandedRow}
  totalColumns={totalColumns}
/>
```

```tsx
<StandardTableBody<T>
  columns={finalColumns}
  density={density}
  striped={striped}
  table={table}
  onRowClick={onRowClick}
  renderExpandedRow={renderExpandedRow}
  totalColumns={totalColumns}
/>
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm test -- components/Table/Table.test.tsx --run`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add components/Table/Table.tsx components/Table/Table.module.scss components/Table/Table.test.tsx
git commit -m "feat(table): add renderExpandedRow prop with chevron toggle"
```

---

### Task 3: Add stories and update skill doc

**Files:**
- Modify: `components/Table/Table.stories.tsx`
- Modify: `skills/doom-design-system/components/table.md`

- [ ] **Step 1: Read the existing stories file**

Read `components/Table/Table.stories.tsx` to understand the existing story patterns and data.

- [ ] **Step 2: Add onRowClick story**

Add a story that demonstrates row click with a toast or console log:

```tsx
export const RowClick: Story = {
  args: {
    columns: columns,
    data: sampleData,
    onRowClick: (row) => {
      console.log("Clicked:", row.original);
    },
  },
};
```

Use whatever `columns` and `sampleData` are defined in the existing stories file.

- [ ] **Step 3: Add ExpandableRows story**

```tsx
export const ExpandableRows: Story = {
  args: {
    columns: columns,
    data: sampleData,
    renderExpandedRow: (row) => (
      <div style={{ padding: "var(--spacing-4)" }}>
        <Text variant="h5">{row.original.name} — Details</Text>
        <Text variant="body" color="muted">
          Additional details for this row. This content spans the full width of
          the table and can contain any React content.
        </Text>
      </div>
    ),
  },
};
```

- [ ] **Step 4: Add MixedExpandable story (some rows expandable, some not)**

```tsx
export const MixedExpandable: Story = {
  args: {
    columns: columns,
    data: sampleData,
    renderExpandedRow: (row) => {
      // Only even-indexed rows are expandable
      if (row.index % 2 !== 0) return null;
      return (
        <div style={{ padding: "var(--spacing-4)" }}>
          <Text variant="body">Expanded content for row {row.index}</Text>
        </div>
      );
    },
  },
};
```

- [ ] **Step 5: Add CombinedFeatures story (click + expand)**

```tsx
export const ClickAndExpand: Story = {
  args: {
    columns: columns,
    data: sampleData,
    onRowClick: (row) => {
      console.log("Row clicked:", row.original);
    },
    renderExpandedRow: (row) => (
      <div style={{ padding: "var(--spacing-4)" }}>
        <Text variant="body">Details for {row.original.name}</Text>
      </div>
    ),
  },
};
```

- [ ] **Step 6: Update table skill doc**

In `skills/doom-design-system/components/table.md`, add the two new props to the Props table:

```
| `onRowClick` | `(row: Row<T>, e: React.MouseEvent) => void` | — | Click handler for rows (adds pointer cursor) |
| `renderExpandedRow` | `(row: Row<T>) => ReactNode \| null` | — | Expanded content per row; return `null` for non-expandable rows |
```

Add a new section after "Advanced Filtering":

```markdown
## Row Click

```tsx
<Table
  data={users}
  columns={columns}
  onRowClick={(row) => navigate(`/users/${row.original.id}`)}
/>
```

## Expandable Rows

```tsx
<Table
  data={orders}
  columns={columns}
  renderExpandedRow={(row) => {
    if (!row.original.details) return null; // non-expandable
    return <OrderDetails data={row.original.details} />;
  }}
/>
```

A chevron column is auto-prepended. Rows returning `null` show no chevron.
```

Add to Notes:

```
- `onRowClick` does not fire when clicking the expand chevron
- Both features work with virtualization
```

- [ ] **Step 7: Run all tests**

Run: `npm test -- --run`
Expected: All 94+ test files pass

- [ ] **Step 8: Commit**

```bash
git add components/Table/Table.stories.tsx skills/doom-design-system/components/table.md
git commit -m "feat(table): add stories and docs for row click and expandable rows"
```
