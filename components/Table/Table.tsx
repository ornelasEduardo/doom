"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table as ReactTableInstance,
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

// Instantiate factories outside the component to ensure stable references
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
  enableVirtualization?: boolean;
  pageSize?: number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "flat";
  density?: "compact" | "standard" | "relaxed";
  toolbarContent?: React.ReactNode;
  filters?: {
    columnId: string;
    label: string;
    options: { value: string; label: string }[];
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
  enableSorting = true,
  enableVirtualization = false,
  pageSize = 10,
  height,
  className,
  style,
  variant = "default",
  density = "standard",
  toolbarContent,
  filters,
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
    enableSorting,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getPaginationRowModel: enablePagination ? paginationRowModel : undefined,
    getFilteredRowModel: enableFiltering ? filteredRowModel : undefined,
  });

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  const isVirtual = enableVirtualization;
  const effectiveHeight = isVirtual ? (height ?? 400) : height;

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
              className={styles.search}
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

      {filters?.length && (
        <div className={styles.toolbar} style={{ marginTop: "-1rem" }}>
          {filters.map((filter) => (
            <Select
              key={filter.columnId}
              options={filter.options}
              placeholder={filter.label}
              value={
                (table
                  .getColumn(filter.columnId)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn(filter.columnId)?.setFilterValue(e.target.value)
              }
            />
          ))}
        </div>
      )}

      <div
        ref={setScrollElement}
        className={styles.tableWrapper}
        style={{
          height: effectiveHeight ?? "auto",
          overflow: effectiveHeight ? "auto" : "visible",
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
            <VirtualTableBody
              columns={columns}
              density={density}
              scrollElement={scrollElement}
              striped={striped}
              table={table}
            />
          ) : (
            <StandardTableBody
              columns={columns}
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
    </div>
  );
}
