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
  SortingState,
  Table as ReactTableInstance,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { Filter, ListFilter, Search } from "lucide-react";
import React, { useMemo, useState } from "react";

import { Button } from "../Button/Button";
import { Chip } from "../Chip/Chip";
import { Input } from "../Input/Input";
import { Flex } from "../Layout/Layout";
import { Pagination } from "../Pagination/Pagination";
import { Select } from "../Select/Select";
import {
  countConditions,
  type FilterOperatorKey,
} from "./FilterBuilder/FilterBuilder";
import type { FilterGroupItem, FilterItem } from "./FilterBuilder/FilterGroup";
import { FilterSheetNested } from "./FilterBuilder/FilterSheetNested";
import styles from "./Table.module.scss";
import { TableHeaderFilter } from "./TableHeaderFilter";
import type { FilterNode } from "./utils/filterAst";
import { evaluateFilter } from "./utils/filterAst";

const coreRowModel = getCoreRowModel();
const sortedRowModel = getSortedRowModel();
const paginationRowModel = getPaginationRowModel();
const filteredRowModel = getFilteredRowModel();

const convertToFilterNode = (item: FilterItem): FilterNode => {
  if (item.type === "group") {
    return {
      type: "group",
      logic: item.logic,
      conditions: (item.children || []).map(convertToFilterNode),
    };
  }
  return {
    type: "condition",
    field: item.field,
    operator: item.operator,
    value: item.value,
    logic: item.logic,
  };
};

export interface TableProps<T> {
  data: T[];
  /**
   * Column definitions. Can be:
   * - Simple strings: ["Name", "Age"] - uses string as both accessorKey and header
   * - Full ColumnDef objects for advanced usage
   */
  columns: (string | ColumnDef<T, unknown>)[];
  enablePagination?: boolean;
  enableFiltering?: boolean;
  enableColumnFilters?: boolean;
  enableSorting?: boolean;
  enableVirtualization?: boolean;
  enableAdvancedFiltering?: boolean;
  onAdvancedFilterChange?: (value: FilterGroupItem) => void;
  pageSize?: number;
  height?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "flat";
  density?: "compact" | "standard" | "relaxed";
  toolbarContent?: React.ReactNode;
  filters?: {
    columnId: string;
    label: string;
    type?: "select" | "text" | "number";
    options?: { value: string; label: string }[];
    operators?: FilterOperatorKey[];
  }[];
  striped?: boolean;
}

interface BodyProps<T> {
  table: ReactTableInstance<T>;
  columns: ColumnDef<T>[];
  striped: boolean;
  density: "compact" | "standard" | "relaxed";
}

interface VirtualBodyProps<T> extends BodyProps<T> {
  scrollElement: HTMLDivElement | null;
}

function VirtualTableBody<T>({
  table,
  columns,
  striped,
  density,
  scrollElement,
}: VirtualBodyProps<T>) {
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <tbody>
      {rowVirtualizer.getVirtualItems().length > 0 && (
        <tr
          style={{
            height: `${rowVirtualizer.getVirtualItems()[0].start}px`,
          }}
        >
          <td colSpan={columns.length} style={{ border: 0, padding: 0 }} />
        </tr>
      )}
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <tr
            key={row.id}
            ref={rowVirtualizer.measureElement}
            className={clsx(styles.tr, {
              [styles.striped]: striped && virtualRow.index % 2 !== 0,
            })}
            data-index={virtualRow.index}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={clsx(styles.td, styles[`density-${density}`])}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        );
      })}
      {rowVirtualizer.getVirtualItems().length > 0 && (
        <tr
          style={{
            height: `${
              rowVirtualizer.getTotalSize() -
              rowVirtualizer.getVirtualItems()[
                rowVirtualizer.getVirtualItems().length - 1
              ].end
            }px`,
          }}
        >
          <td colSpan={columns.length} style={{ border: 0, padding: 0 }} />
        </tr>
      )}
    </tbody>
  );
}

function StandardTableBody<T>({ table, striped, density }: BodyProps<T>) {
  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr
          key={row.id}
          className={clsx(styles.tr, striped && styles.striped, "group")}
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

export function Table<T>({
  data,
  columns,
  enablePagination = true,
  enableFiltering = true,
  enableColumnFilters = true,
  enableSorting = true,
  enableVirtualization = false,
  enableAdvancedFiltering = false,
  onAdvancedFilterChange,
  pageSize = 10,
  height,
  className,
  style,
  variant = "default",
  density = "standard",
  toolbarContent,
  filters,
  striped = false,
  maxHeight,
}: TableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const [advancedFilterValue, setAdvancedFilterValue] =
    useState<FilterGroupItem | null>(null);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);

  const smartColumnFilterFn = useMemo<FilterFn<T>>(
    () => (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (Array.isArray(filterValue)) {
        return (filterValue as T[]).includes(value as T);
      }
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
    [],
  );

  const filteredData = useMemo(() => {
    if (!advancedFilterValue || !enableAdvancedFiltering) {
      return data;
    }

    const filterNode = convertToFilterNode(advancedFilterValue);
    if (filterNode.type === "group" && filterNode.conditions.length === 0) {
      return data;
    }

    return data.filter((row) =>
      evaluateFilter(filterNode, row as Record<string, unknown>),
    );
  }, [data, advancedFilterValue, enableAdvancedFiltering]);

  // Normalize columns to ensure they all have IDs and proper format
  // Accepts both string[] and ColumnDef[] for flexibility
  const normalizedColumns = useMemo(() => {
    return columns.map((col, index) => {
      // If it's a string, convert to ColumnDef
      if (typeof col === "string") {
        return {
          id: col,
          accessorKey: col,
          header: col,
        } as ColumnDef<T, unknown>;
      }

      // If column already has an id, use it
      if (col.id) {
        return col;
      }

      // Try to derive id from accessorKey
      const accessorKey = (col as { accessorKey?: string }).accessorKey;
      if (accessorKey) {
        return { ...col, id: accessorKey };
      }

      // Fallback to index-based id
      return { ...col, id: `column-${index}` };
    });
  }, [columns]);

  const table = useReactTable<T>({
    data: filteredData,
    columns: normalizedColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    enableSorting,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getPaginationRowModel: enablePagination ? paginationRowModel : undefined,
    getFilteredRowModel:
      enableFiltering || enableColumnFilters ? filteredRowModel : undefined,
    defaultColumn: {
      filterFn: smartColumnFilterFn,
    },
    getFacetedUniqueValues: enableColumnFilters
      ? getFacetedUniqueValues()
      : undefined,
  });

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  const isVirtual = enableVirtualization;
  const effectiveHeight = isVirtual ? (height ?? 400) : height;

  const activeAdvancedCount = advancedFilterValue
    ? countConditions(advancedFilterValue)
    : 0;

  return (
    <div
      className={clsx(
        styles.container,
        variant === "flat" && styles.flat,
        className,
      )}
      style={style}
    >
      {(enableFiltering ||
        toolbarContent ||
        enableAdvancedFiltering ||
        (filters && filters.length > 0)) && (
        <div className={styles.headerGroup}>
          {(enableFiltering || toolbarContent || enableAdvancedFiltering) && (
            <div className={styles.searchBar}>
              {enableFiltering && (
                <div className={styles.searchWrapper}>
                  <Input
                    endAdornment={
                      enableAdvancedFiltering ? (
                        <Button
                          aria-label="Filter builder"
                          size="sm"
                          style={{
                            height: "24px",
                            padding: "0 4px",
                            marginRight: "-4px",
                          }}
                          variant="ghost"
                          onClick={() => setIsFilterBuilderOpen(true)}
                        >
                          <Filter size={16} strokeWidth={2.5} />
                        </Button>
                      ) : undefined
                    }
                    placeholder="Search..."
                    startAdornment={<Search size={16} />}
                    value={globalFilter ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGlobalFilter(e.target.value)
                    }
                  />
                </div>
              )}

              <div className={styles.actionsWrapper}>
                {filters && filters.length > 0 && !enableAdvancedFiltering && (
                  <Button
                    variant="outline"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <ListFilter size={16} />
                    FILTERS
                  </Button>
                )}
                {toolbarContent && (
                  <div className={styles.controls}>{toolbarContent}</div>
                )}
              </div>
            </div>
          )}

          {enableAdvancedFiltering && activeAdvancedCount > 0 && (
            <div className={styles.filterBar}>
              <Chip
                onClick={() => setIsFilterBuilderOpen(true)}
                onDismiss={() => {
                  setAdvancedFilterValue(null);
                  onAdvancedFilterChange?.(null as unknown as FilterGroupItem);
                }}
              >
                {activeAdvancedCount} Filter
                {activeAdvancedCount > 1 ? "s" : ""}
              </Chip>
            </div>
          )}

          {!enableAdvancedFiltering &&
            filters &&
            filters.length > 0 &&
            isFilterExpanded && (
              <div className={styles.filterBar}>
                {filters.map((filter) => (
                  <div key={filter.columnId} className={styles.filterItem}>
                    <Select
                      options={filter.options ?? []}
                      placeholder={filter.label}
                      size="sm"
                      value={
                        (table
                          .getColumn(filter.columnId)
                          ?.getFilterValue() as string) ?? ""
                      }
                      onChange={(e) =>
                        table
                          .getColumn(filter.columnId)
                          ?.setFilterValue(e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      <div
        ref={setScrollElement}
        className={styles.tableWrapper}
        style={{
          height: effectiveHeight ?? "auto",
          maxHeight: maxHeight ?? "none",
          overflow: effectiveHeight || maxHeight ? "auto" : "visible",
          overflowX: "auto",
          width: "100%",
        }}
        tabIndex={0}
      >
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={clsx(
                        styles.th,
                        styles[density],
                        canSort && styles.sortable,
                      )}
                      style={{ width: header.getSize() }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className={styles.headerContent}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort &&
                          ({
                            asc: " ▲",
                            desc: " ▼",
                          }[header.column.getIsSorted() as string] ??
                            null)}
                        {enableColumnFilters &&
                          !enableAdvancedFiltering &&
                          header.column.getCanFilter() && (
                            <TableHeaderFilter column={header.column} />
                          )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {isVirtual ? (
            <VirtualTableBody<T>
              columns={normalizedColumns}
              density={density}
              scrollElement={scrollElement}
              striped={striped}
              table={table}
            />
          ) : (
            <StandardTableBody<T>
              columns={normalizedColumns}
              density={density}
              striped={striped}
              table={table}
            />
          )}
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className={styles.noResults}>No results found.</div>
        )}
      </div>

      {enablePagination && !isVirtual && (
        <div className={styles.paginationContainer}>
          <Flex
            align="center"
            gap={4}
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div style={{ flexShrink: 0 }}>
              <Select
                options={[
                  { value: 10, label: "10 rows" },
                  { value: 20, label: "20 rows" },
                  { value: 50, label: "50 rows" },
                  { value: 100, label: "100 rows" },
                ]}
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              />
            </div>
            <Pagination
              currentPage={table.getState().pagination.pageIndex + 1}
              totalPages={table.getPageCount()}
              onPageChange={(page) => table.setPageIndex(page - 1)}
            />
          </Flex>
        </div>
      )}

      {enableAdvancedFiltering && (
        <FilterSheetNested
          fields={
            filters?.map((f) => ({
              key: f.columnId,
              label: f.label,
              type: f.type ?? "text",
              operators: f.operators ?? ["eq", "neq", "contains"],
              options: f.options,
            })) ?? []
          }
          initialValue={advancedFilterValue}
          isOpen={isFilterBuilderOpen}
          onApply={(val) => {
            setAdvancedFilterValue(val);
            onAdvancedFilterChange?.(val);
          }}
          onClose={() => setIsFilterBuilderOpen(false)}
        />
      )}
    </div>
  );
}
