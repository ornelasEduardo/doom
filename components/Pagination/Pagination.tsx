'use client';

import React from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../Button';

const PaginationNav = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  background-color: ${props => props.isActive ? 'var(--primary)' : 'var(--card-bg)'};
  color: ${props => props.isActive ? 'var(--primary-foreground)' : 'var(--foreground)'};
  font-family: var(--font-heading);
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${props => props.isActive ? 'var(--shadow-sm)' : 'none'};

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-sm);
    background-color: var(--primary);
    color: var(--primary-foreground);
  }

  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--muted);
  }
`;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Max buttons to show

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex truncation logic
      if (currentPage <= 4) {
        // Near start: 1 2 3 4 5 ... N
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... N-4 N-3 N-2 N-1 N
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Middle: 1 ... C-1 C C+1 ... N
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
            <MoreHorizontal size={20} />
          </span>
        );
      }
      
      const pageNum = page as number;
      return (
        <PageButton
          key={pageNum}
          isActive={currentPage === pageNum}
          onClick={() => handlePageChange(pageNum)}
          aria-current={currentPage === pageNum ? 'page' : undefined}
        >
          {pageNum}
        </PageButton>
      );
    });
  };

  return (
    <PaginationNav aria-label="pagination" className={className}>
      <PageButton 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </PageButton>
      
      {renderPageNumbers()}
      
      <PageButton 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </PageButton>
    </PaginationNav>
  );
}
