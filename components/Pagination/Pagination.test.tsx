import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination Component", () => {
  const mockOnPageChange = vi.fn();

  it("renders correct page numbers", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("marks current page as active", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    const activeInfo = screen.getByText("3");
    expect(activeInfo).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange when clicking a page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    fireEvent.click(screen.getByText("2"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("disables prev button on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    const prevBtn = screen.getByLabelText("Go to previous page");
    expect(prevBtn).toBeDisabled();
  });

  it("handles ellipsis rendering near start", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("handles ellipsis rendering near end", () => {
    render(
      <Pagination
        currentPage={18}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("handles ellipsis rendering in middle", () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("handles next button interactions", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    const nextBtn = screen.getByLabelText("Go to next page");
    fireEvent.click(nextBtn);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it("disables next button on last page", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    );
    const nextBtn = screen.getByLabelText("Go to next page");
    expect(nextBtn).toBeDisabled();
  });

  it("does not trigger change when clicking active page", () => {
    const handleChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={handleChange} />,
    );
    const activePage = screen.getByText("2");
    fireEvent.click(activePage);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
