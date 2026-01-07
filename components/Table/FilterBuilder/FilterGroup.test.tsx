import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { FilterField } from "./FilterBuilder";
import type { FilterGroupItem } from "./FilterGroup";
import { FilterGroup } from "./FilterGroup";

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

describe("FilterGroup", () => {
  const mockFields: FilterField[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "age", label: "Age", type: "number" },
  ];

  const emptyGroup: FilterGroupItem = {
    type: "group",
    id: "group-1",
    children: [],
  };

  const populatedGroup: FilterGroupItem = {
    type: "group",
    id: "group-1",
    children: [
      {
        type: "condition",
        id: "cond-1",
        field: "name",
        operator: "eq",
        value: "Alice",
      },
    ],
  };

  it("should render empty state correctly", () => {
    render(
      <FilterGroup
        fields={mockFields}
        item={emptyGroup}
        parentId=""
        onUpdate={() => {}}
      />,
    );

    expect(screen.getByText(/Start by adding a condition/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Condition" }),
    ).toBeInTheDocument();
  });

  it("should render children", () => {
    render(
      <FilterGroup
        fields={mockFields}
        item={populatedGroup}
        parentId=""
        onUpdate={() => {}}
      />,
    );

    expect(screen.getByDisplayValue("name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
  });

  it("should add condition when Add Condition clicked", () => {
    const handleUpdate = vi.fn();
    render(
      <FilterGroup
        fields={mockFields}
        item={emptyGroup}
        parentId=""
        onUpdate={handleUpdate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Condition" }));

    expect(handleUpdate).toHaveBeenCalled();
    const updatedGroup = handleUpdate.mock.calls[0][0];
    expect(updatedGroup.children).toHaveLength(1);
    expect(updatedGroup.children[0].type).toBe("condition");
  });

  it("should add nested group when Add Group clicked", () => {
    const handleUpdate = vi.fn();
    render(
      <FilterGroup
        fields={mockFields}
        item={emptyGroup}
        parentId=""
        onUpdate={handleUpdate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Group" }));

    expect(handleUpdate).toHaveBeenCalled();
    const updatedGroup = handleUpdate.mock.calls[0][0];
    expect(updatedGroup.children).toHaveLength(1);
    expect(updatedGroup.children[0].type).toBe("group");
  });

  it("should toggle collapse", () => {
    const handleUpdate = vi.fn();
    render(
      <FilterGroup
        fields={mockFields}
        item={populatedGroup}
        parentId=""
        onUpdate={handleUpdate}
      />,
    );

    const collapseBtn = screen.getByLabelText("Collapse group");
    fireEvent.click(collapseBtn);

    expect(handleUpdate).toHaveBeenCalled();
    expect(handleUpdate.mock.calls[0][0].collapsed).toBe(true);
  });

  it("should call onRemove when remove group clicked", () => {
    const handleRemove = vi.fn();
    render(
      <FilterGroup
        fields={mockFields}
        item={emptyGroup}
        parentId=""
        onRemove={handleRemove}
        onUpdate={() => {}}
      />,
    );

    fireEvent.click(screen.getByLabelText("Remove group"));
    expect(handleRemove).toHaveBeenCalled();
  });
});
