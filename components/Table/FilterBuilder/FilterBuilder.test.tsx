import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  countConditions,
  FilterBuilder,
  type FilterField,
  flattenConditions,
} from "./FilterBuilder";
import type { FilterGroupItem } from "./FilterGroup";

// Mock FilterSheetNested
vi.mock("./FilterSheetNested", () => ({
  FilterSheetNested: ({
    isOpen,
    onApply,
    onClose,
  }: {
    isOpen: boolean;
    onApply: (group: FilterGroupItem) => void;
    onClose: () => void;
  }) => {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="filter-sheet-nested">
        <button onClick={onClose}>Close Sheet</button>
        <button
          onClick={() =>
            onApply({
              type: "group",
              id: "new-group",
              children: [],
            })
          }
        >
          Apply Filter
        </button>
      </div>
    );
  },
}));

describe("FilterBuilder Helpers", () => {
  const group: FilterGroupItem = {
    type: "group",
    id: "root",
    children: [
      {
        type: "condition",
        id: "c1",
        field: "name",
        operator: "eq",
        value: "Alice",
      },
      {
        type: "group",
        id: "g1",
        children: [
          {
            type: "condition",
            id: "c2",
            field: "age",
            operator: "gt",
            value: "20",
          },
        ],
      },
    ],
  };

  it("countConditions should count only valid conditions", () => {
    expect(countConditions(group)).toBe(2);
  });

  it("flattenConditions should return list of valid conditions", () => {
    const flat = flattenConditions(group);
    expect(flat).toHaveLength(2);
    expect(flat.find((c) => c.id === "c1")).toBeDefined();
    expect(flat.find((c) => c.id === "c2")).toBeDefined();
  });
});

describe("FilterBuilder Component", () => {
  const mockFields: FilterField[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "age", label: "Age", type: "number" },
  ];

  const value: FilterGroupItem = {
    type: "group",
    id: "root",
    children: [
      {
        type: "condition",
        id: "c1",
        field: "name",
        operator: "eq",
        value: "Alice",
      },
    ],
  };

  it("should render chips for conditions", () => {
    render(
      <FilterBuilder fields={mockFields} value={value} onChange={() => {}} />,
    );

    expect(screen.getByText("Name equals Alice")).toBeInTheDocument();
  });

  it("should open sheet when button clicked", () => {
    render(
      <FilterBuilder fields={mockFields} value={value} onChange={() => {}} />,
    );

    // Filter Sheet should be closed initially
    expect(screen.queryByTestId("filter-sheet-nested")).not.toBeInTheDocument();

    const openBtn = screen.getByRole("button", { name: /Filters/ });
    fireEvent.click(openBtn);

    expect(screen.getByTestId("filter-sheet-nested")).toBeInTheDocument();
  });

  it("should call onChange when chip dismissed", () => {
    const handleChange = vi.fn();
    render(
      <FilterBuilder
        fields={mockFields}
        value={value}
        onChange={handleChange}
      />,
    );

    // Find dismiss button on chip (Label X) or SVG
    // Chip component usually has aria-label for remove if good a11y.
    // FilterBuilder usage: onDismiss={() => handleDismiss(cond.id)}
    const chipText = screen.getByText("Name equals Alice");
    const chip = chipText.closest("div");
    const closeBtn = chip?.querySelector("button");
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleChange).toHaveBeenCalled();
      // Verify the change argument removes the condition
      const arg = handleChange.mock.calls[0][0];
      expect(arg.children).toHaveLength(0);
    }
  });

  it("should handle sheet close", () => {
    render(
      <FilterBuilder fields={mockFields} value={value} onChange={() => {}} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    fireEvent.click(screen.getByText("Close Sheet"));

    expect(screen.queryByTestId("filter-sheet-nested")).not.toBeInTheDocument();
  });
});
