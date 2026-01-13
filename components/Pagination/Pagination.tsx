"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import React from "react";

import styles from "./Pagination.module.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
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
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... N-4 N-3 N-2 N-1 N
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... C-1 C C+1 ... N
        pages.push(1);
        pages.push("ellipsis");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === "ellipsis") {
        return (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            <MoreHorizontal size={20} />
          </span>
        );
      }

      const pageNum = page as number;
      return (
        <button
          key={pageNum}
          aria-current={currentPage === pageNum ? "page" : undefined}
          className={clsx(
            styles.button,
            currentPage === pageNum && styles.active,
          )}
          onClick={() => handlePageChange(pageNum)}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <nav aria-label="pagination" className={clsx(styles.nav, className)}>
      <button
        aria-label="Go to previous page"
        className={styles.button}
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      {renderPageNumbers()}

      <button
        aria-label="Go to next page"
        className={styles.button}
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </nav>
  );
}
