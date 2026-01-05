import { Column } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { TableHeaderFilter } from "./TableHeaderFilter";

// Mock Popover and Combobox to simplify testing interaction
vi.mock("../Popover/Popover", () => ({
  Popover: ({ trigger, content, isOpen, onClose }: any) => (
    <div data-testid="mock-popover">
      <div onClick={() => onClose && onClose()}>{trigger}</div>
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

vi.mock("../Combobox/Combobox", () => ({
  Combobox: ({ onChange, value, options }: any) => (
    <div data-testid="mock-combobox">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          onClick={() => {
            // Toggle logic simulation for multi-select
            const newValue = value.includes(opt.value)
              ? value.filter((v: string) => v !== opt.value)
              : [...value, opt.value];
            onChange(newValue);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

describe("TableHeaderFilter", () => {
  const mockColumn = {
    id: "name",
    getFilterValue: vi.fn(),
    setFilterValue: vi.fn(),
    getFacetedUniqueValues: vi.fn(
      () =>
        new Map([
          ["Alice", 1],
          ["Bob", 1],
        ]),
    ),
    columnDef: {
      header: "Name",
    },
  } as unknown as Column<any, unknown>;

  it("should render trigger button", () => {
    (mockColumn.getFilterValue as any).mockReturnValue(undefined);
    render(<TableHeaderFilter column={mockColumn} />);
    expect(screen.getByLabelText("Filter by Name")).toBeInTheDocument();
  });

  it("should render active count", () => {
    (mockColumn.getFilterValue as any).mockReturnValue(["Alice"]);
    render(<TableHeaderFilter column={mockColumn} />);
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("should open popover on click", () => {
    (mockColumn.getFilterValue as any).mockReturnValue(undefined);
    render(<TableHeaderFilter column={mockColumn} />);

    expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Filter by Name"));

    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
  });

  it("should generate options from column if not provided", () => {
    (mockColumn.getFilterValue as any).mockReturnValue(undefined);
    render(<TableHeaderFilter column={mockColumn} />);
    fireEvent.click(screen.getByLabelText("Filter by Name"));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should call setFilterValue when option selected", () => {
    (mockColumn.getFilterValue as any).mockReturnValue([]);
    render(<TableHeaderFilter column={mockColumn} />);
    fireEvent.click(screen.getByLabelText("Filter by Name"));

    const aliceBtn = screen.getByText("Alice");
    fireEvent.click(aliceBtn);

    // Check if setFilterValue called with correct value
    // Since map keys are values (string -> value).
    // In mock, uniqueValues set value as value.
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(["Alice"]);
  });

  it("should use provided options if available", () => {
    const options = [{ value: "custom", label: "Custom Label" }];
    render(<TableHeaderFilter column={mockColumn} options={options} />);
    fireEvent.click(screen.getByLabelText("Filter by Name"));

    expect(screen.getByText("Custom Label")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });
});
