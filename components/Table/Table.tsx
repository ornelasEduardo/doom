'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
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
import { Button, Input, Select, Flex, Text } from '../..';

// --- Styled Components ---

const TableContainer = styled.div`
  width: 100%;
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  background: var(--card-bg);
  box-shadow: var(--shadow-hard);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  padding: 1rem;
  border-bottom: var(--border-width) solid var(--card-border);
  background: var(--background);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-base);
`;

const getDensityPadding = (density: 'compact' | 'standard' | 'relaxed' = 'standard') => {
  switch (density) {
    case 'compact': return '0.5rem 1rem';
    case 'relaxed': return '1.5rem 1rem';
    case 'standard':
    default: return '1rem';
  }
};

const Th = styled.th<{ isSortable?: boolean; $density?: 'compact' | 'standard' | 'relaxed' }>`
  text-align: left;
  padding: ${props => getDensityPadding(props.$density)};
  background: var(--secondary);
  border-bottom: var(--border-width) solid var(--card-border);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: ${props => props.isSortable ? 'pointer' : 'default'};
  user-select: none;
  white-space: nowrap;
  color: var(--secondary-foreground);

  ${props => props.isSortable && `
    &:hover {
      filter: brightness(0.95);
      color: var(--secondary-foreground);
    }
  `}
`;

const Td = styled.td<{ $density?: 'compact' | 'standard' | 'relaxed' }>`
  padding: ${props => getDensityPadding(props.$density)};
  border-bottom: 1px solid var(--card-border);
  color: var(--foreground);
`;

const Tr = styled.tr<{ $striped?: boolean }>`
  &:last-child td {
    border-bottom: none;
  }
  &:hover {
    background-color: rgba(var(--muted-rgb, 113, 128, 150), 0.1);
  }

  ${props => props.$striped && `
    &:nth-of-type(even) {
      background-color: rgba(var(--muted-rgb, 113, 128, 150), 0.05);
    }
    &:hover {
      background-color: rgba(var(--muted-rgb, 113, 128, 150), 0.15);
    }
  `}

  /* Hide actions by default */
  & .row-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  /* Show actions on hover */
  &:hover .row-actions {
    opacity: 1;
  }
`;

const PaginationContainer = styled.div`
  padding: 1rem;
  border-top: var(--border-width) solid var(--card-border);
  background: var(--background);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// --- Component ---

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

  const variantStyles: React.CSSProperties = variant === 'flat' ? {
    border: 'none',
    boxShadow: 'none',
    background: 'transparent',
    borderRadius: 0,
  } : {};

  return (
    <TableContainer className={className} style={{ ...variantStyles, ...style }}>
      {enableFiltering && (
        <Toolbar>
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
        </Toolbar>
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
        <StyledTable>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.getSize() }}
                      isSortable={canSort}
                      $density={density}
                    >
                      <Flex align="center" gap="0.5rem">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && ({
                          asc: ' ▲',
                          desc: ' ▼',
                        }[header.column.getIsSorted() as string] ?? null)}
                      </Flex>
                    </Th>
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
                  <Tr
                    key={row.id}
                    $striped={striped}
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
                      <Td key={cell.id} $density={density}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id} className="group" $striped={striped}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id} $density={density}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          )}
        </StyledTable>
        
        {table.getRowModel().rows.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            No results found.
          </div>
        )}
      </div>

      {enablePagination && !isVirtual && (
        <PaginationContainer>
          <Flex gap="1rem" align="center">
            <Text color="muted" className="min-w-fit">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </Text>
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
          </Flex>
          <Flex gap="0.5rem">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </Flex>
        </PaginationContainer>
      )}
    </TableContainer>
  );
}
