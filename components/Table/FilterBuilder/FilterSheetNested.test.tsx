import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { FilterField } from "./FilterBuilder";
import type { FilterConditionItem, FilterGroupItem } from "./FilterGroup";
import { FilterSheetNested } from "./FilterSheetNested";

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
  useSensor: vi.fn(),
  useSensors: () => [],
  MouseSensor: {},
  TouchSensor: {},
  KeyboardSensor: {},
  pointerWithin: vi.fn(),
}));

// Mock Sheet
vi.mock("../../Sheet/Sheet", () => ({
  Sheet: ({
    children,
    footer,
    isOpen,
    onClose,
  }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="mock-sheet">
        <button onClick={onClose}>Close Sheet Test</button>
        <div data-testid="sheet-content">{children}</div>
        <div data-testid="sheet-footer">{footer}</div>
      </div>
    );
  },
}));

// Recursive Mock FilterGroup
vi.mock("./FilterGroup", () => {
  const MockFilterGroup = ({
    item,
    onUpdate,
  }: {
    item: FilterGroupItem;
    onUpdate: (g: FilterGroupItem) => void;
  }) => (
    <div data-testid={`group-${item.id}`}>
      <span data-testid="group-id">{item.id}</span>
      <div data-testid="children-container">
        {item.children?.map((child) => (
          <div key={child.id} data-testid={`child-${child.id}`}>
            {child.type === "group" ? (
              <MockFilterGroup
                item={child}
                onUpdate={(_updatedChild) => {
                  /* No-op for mock display */
                }}
              />
            ) : (
              <span>Condition: {child.id}</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          onUpdate({
            ...item,
            children: [
              ...item.children,

              {
                type: "condition",
                id: "new-cond",
                field: "name",
                operator: "eq",
                value: "Alice",
              } as FilterConditionItem,
            ],
          })
        }
      >
        Add Test Condition
      </button>
    </div>
  );
  return {
    FilterGroup: MockFilterGroup,
    ConditionRow: () => (
      <div data-testid="mock-condition-row">Condition Row</div>
    ),
  };
});

describe("FilterSheetNested", () => {
  const mockFields: FilterField[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "age", label: "Age", type: "number" },
  ];

  const defaultProps = {
    fields: mockFields,
    initialValue: null,
    isOpen: true,
    onApply: () => {},
    onClose: () => {},
  };

  it("should render when open", () => {
    render(<FilterSheetNested {...defaultProps} />);
    expect(screen.getByTestId("mock-sheet")).toBeInTheDocument();
  });

  it("should render DndContext wrapper", () => {
    render(<FilterSheetNested {...defaultProps} />);
    expect(screen.getByTestId("dnd-context")).toBeInTheDocument();
  });

  it("should initialize with empty group if no value", () => {
    render(<FilterSheetNested {...defaultProps} initialValue={null} />);
    expect(screen.getByTestId("group-id")).not.toBeEmptyDOMElement();
  });

  it("should call onApply with current group state", () => {
    const handleApply = vi.fn();
    render(<FilterSheetNested {...defaultProps} onApply={handleApply} />);

    fireEvent.click(screen.getByText("Add Test Condition"));
    fireEvent.click(screen.getByText(/APPLY/));

    expect(handleApply).toHaveBeenCalled();
    const appliedGroup = handleApply.mock.calls[0][0];
    expect(appliedGroup.children).toHaveLength(1);
  });

  it("should clear state when CLEAR ALL clicked", () => {
    render(<FilterSheetNested {...defaultProps} />);

    fireEvent.click(screen.getByText("Add Test Condition"));
    expect(screen.getByText(/APPLY \(1\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("CLEAR ALL"));
    expect(screen.getByText("APPLY")).toBeInTheDocument();
  });

  it("should render initial value structure", () => {
    const initial: FilterGroupItem = {
      type: "group",
      id: "root",
      children: [
        {
          type: "group",
          id: "g1",
          children: [],
        },
      ],
    };

    render(<FilterSheetNested {...defaultProps} initialValue={initial} />);
    expect(screen.getByTestId("child-g1")).toBeInTheDocument();
  });
});
