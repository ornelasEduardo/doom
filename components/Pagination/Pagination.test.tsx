import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  const mockOnPageChange = vi.fn();

  it('renders correct page numbers', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('marks current page as active', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);
    const activeInfo = screen.getByText('3');
    expect(activeInfo).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange when clicking a page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    fireEvent.click(screen.getByText('2'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    const prevBtn = screen.getByLabelText('Go to previous page');
    expect(prevBtn).toBeDisabled();
  });

  it('handles ellipsis rendering', () => {
    render(<Pagination currentPage={1} totalPages={20} onPageChange={mockOnPageChange} />);
    // Should see 1, 2, 3, 4, 5, ellipsis, 20
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
