"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  type Table as ReactTable,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import React, { useState } from "react";

import { Input } from "../Input/Input";
import { Flex } from "../Layout/Layout";
import { Pagination } from "../Pagination/Pagination";
import { Select } from "../Select/Select";
import styles from "./Table.module.scss";

// Instantiate factory functions outside to maintain referential stability
const coreRowModel = getCoreRowModel();
const sortedRowModel = getSortedRowModel();
const paginationRowModel = getPaginationRowModel();
const filteredRowModel = getFilteredRowModel();

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  enablePagination?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  pageSize?: number;
  height?: string | number; // If provided, enables virtualization (simplified)
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "flat";
  density?: "compact" | "standard" | "relaxed";
  toolbarContent?: React.ReactNode;
  striped?: boolean;
}

interface VirtualizedTableBodyProps<T> {
  table: ReactTable<T>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  columns: ColumnDef<T>[];
  striped: boolean;
  density: "compact" | "standard" | "relaxed";
  estimateSize?: () => number;
}

function VirtualizedTableBody<T>({
  table,
  parentRef,
  columns,
  striped,
  density,
  estimateSize = () => 50,
}: VirtualizedTableBodyProps<T>) {
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <tbody>
      {virtualItems.length > 0 && (
        <tr
          style={{
            height: `${virtualItems[0].start}px`,
          }}
        >
          <td colSpan={columns.length} style={{ border: 0, padding: 0 }} />
        </tr>
      )}
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <tr
            key={row.id}
            className={clsx(styles.tr, striped && styles.striped)}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={clsx(styles.td, styles[density])}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        );
      })}
      {virtualItems.length > 0 && (
        <tr
          style={{
            height: `${
              rowVirtualizer.getTotalSize() -
              virtualItems[virtualItems.length - 1].end
            }px`,
          }}
        >
          <td colSpan={columns.length} style={{ border: 0, padding: 0 }} />
        </tr>
      )}
    </tbody>
  );
}

export function Table<T>({
  data,
  columns,
  enablePagination = true,
  enableFiltering = true,
  enableSorting = true,
  pageSize = 10,
  height,
  className,
  style,
  variant = "default",
  density = "standard",
  toolbarContent,
  striped = false,
}: TableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    enableSorting, // Pass this to useReactTable
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getPaginationRowModel: enablePagination ? paginationRowModel : undefined,
    getFilteredRowModel: enableFiltering ? filteredRowModel : undefined,
  });

  // Virtualization Logic (Simplified for rows)
  const parentRef = React.useRef<HTMLDivElement>(null);
  const isVirtual = !!height;

  return (
    <div
      className={clsx(
        styles.container,
        variant === "flat" && styles.flat,
        className,
      )}
      style={style}
    >
      {enableFiltering && (
        <div className={styles.toolbar}>
          <div style={{ width: "300px" }}>
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          {toolbarContent && (
            <Flex align="center" gap={4}>
              {toolbarContent}
            </Flex>
          )}
        </div>
      )}

      <div
        ref={parentRef}
        style={{
          height: height ? height : "auto",
          overflowY: height ? "auto" : "visible",
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
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {isVirtual ? (
            <VirtualizedTableBody
              table={table}
              parentRef={parentRef}
              columns={columns}
              striped={striped}
              density={density}
            />
          ) : (
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={clsx(
                    styles.tr,
                    striped && styles.striped,
                    "group",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={clsx(styles.td, styles[density])}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
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
    </div>
  );
}
