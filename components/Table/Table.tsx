'use client';

import clsx from 'clsx';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Flex } from '../Layout/Layout';
import { Pagination } from '../Pagination/Pagination';
import styles from './Table.module.scss';
import React, { useState } from 'react';

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
  variant?: 'default' | 'flat';
  density?: 'compact' | 'standard' | 'relaxed';
  toolbarContent?: React.ReactNode;
  striped?: boolean;
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
  variant = 'default',
  density = 'standard',
  toolbarContent,
  striped = false,
}: TableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // Always provide the model, enableSorting controls if it's used
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
  });

  // Virtualization Logic (Simplified for rows)
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimate row height
    overscan: 5,
  });

  const isVirtual = !!height;

  return (
    <div 
      className={clsx(styles.container, variant === 'flat' && styles.flat, className)} 
      style={style}
    >
      {enableFiltering && (
        <div className={styles.toolbar}>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Search..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          {toolbarContent && (
            <Flex gap="1rem" align="center">
              {toolbarContent}
            </Flex>
          )}
        </div>
      )}

      <div 
        ref={parentRef} 
        style={{ 
          height: height ? height : 'auto', 
          overflowY: height ? 'auto' : 'visible',
          overflowX: 'auto',
          width: '100%'
        }}
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
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.getSize() }}
                      className={clsx(
                        styles.th, 
                        styles[density], 
                        canSort && styles.sortable
                      )}
                    >
                      <div className={styles.headerContent}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && ({
                          asc: ' ▲',
                          desc: ' ▼',
                        }[header.column.getIsSorted() as string] ?? null)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          
          {isVirtual ? (
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    className={clsx(styles.tr, striped && styles.striped)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={clsx(styles.td, styles[density])}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={clsx(styles.tr, striped && styles.striped, 'group')}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={clsx(styles.td, styles[density])}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
        
        {table.getRowModel().rows.length === 0 && (
          <div className={styles.noResults}>
            No results found.
          </div>
        )}
      </div>

      {enablePagination && !isVirtual && (
        <div className={styles.paginationContainer}>
          <Flex gap="1rem" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div style={{ flexShrink: 0 }}>
              <Select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                options={[
                  { value: 10, label: '10 rows' },
                  { value: 20, label: '20 rows' },
                  { value: 50, label: '50 rows' },
                  { value: 100, label: '100 rows' },
                ]}
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
