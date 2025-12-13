import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from './Table';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// Mock Design System components
vi.mock('../..', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Input: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
  Select: ({ value, onChange, options }: any) => (
    <select value={value} onChange={onChange}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  Flex: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('../Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  ),
}));

interface TestData {
  id: number;
  name: string;
  age: number;
}

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
];

const data: TestData[] = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
  { id: 2, name: 'Bob', age: 30 },
];

describe('Table Component', () => {
  it('should render data', () => {
    render(<Table data={data} columns={columns} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should filter data', () => {
    render(<Table data={data} columns={columns} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('should sort data', async () => {
    render(<Table data={data} columns={columns} />);
    
    const nameHeader = screen.getByText('Name').closest('th');
    fireEvent.click(nameHeader!);
    
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alice');
    expect(rows[2]).toHaveTextContent('Bob');
    expect(rows[3]).toHaveTextContent('Charlie');
    
    fireEvent.click(nameHeader!);
    
    const rowsDesc = screen.getAllByRole('row');
    expect(rowsDesc[1]).toHaveTextContent('Charlie');
    expect(rowsDesc[2]).toHaveTextContent('Bob');
    expect(rowsDesc[3]).toHaveTextContent('Alice');
  });

  it('should paginate data', () => {
    render(<Table data={data} columns={columns} pageSize={1} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByLabelText('Go to next page'));
    
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should render with striped prop', () => {
    render(<Table data={data} columns={columns} striped={true} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // We can't easily test the style here without more setup, but this ensures no crash
  });
});
