import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { FilterField } from "./FilterBuilder";
import type { FilterGroupItem } from "./FilterGroup";
import { FilterSheetNested } from "./FilterSheetNested";

// Mock DnD
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  monitorForElements: vi.fn(),
  draggable: () => () => {},
  dropTargetForElements: () => () => {},
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
    footer: React.ReactNode;
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
    group,
    onUpdate,
  }: {
    group: FilterGroupItem;
    onUpdate: (g: FilterGroupItem) => void;
  }) => (
    <div data-testid={`group-${group.id}`}>
      <span data-testid="group-id">{group.id}</span>
      <div data-testid="children-container">
        {group.children?.map((child) => (
          <div key={child.id} data-testid={`child-${child.id}`}>
            {child.type === "group" ? (
              <MockFilterGroup
                group={child}
                onUpdate={(updatedChild) => {
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
            ...group,
            children: [
              ...group.children,
              {
                type: "condition",
                id: "new-cond",
                field: "name",
                operator: "eq",
                value: "Alice",
              } as any,
            ],
          })
        }
      >
        Add Test Condition
      </button>
    </div>
  );
  return { FilterGroup: MockFilterGroup };
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

  it("should prevent dropping deep group into deep structure (Max Depth)", () => {
    const initial: FilterGroupItem = {
      type: "group",
      id: "root",
      children: [
        {
          type: "group",
          id: "g1",
          children: [
            {
              type: "group",
              id: "g2",
              children: [{ type: "group", id: "g3", children: [] }],
            },
          ],
        },
      ],
    };

    render(<FilterSheetNested {...defaultProps} initialValue={initial} />);

    const sourceGroup = { type: "group", id: "source-group", children: [] };

    const calls = (monitorForElements as any).mock.calls;
    const { onDrop } = calls[calls.length - 1][0];

    act(() => {
      onDrop({
        source: { data: { id: "source-group", item: sourceGroup } },
        location: {
          current: {
            dropTargets: [{ data: { targetId: "g3", position: "inside" } }],
          },
        },
      });
    });

    expect(screen.queryByTestId("child-source-group")).not.toBeInTheDocument();
  });

  it("should allow valid move", () => {
    const initial: FilterGroupItem = {
      type: "group",
      id: "root",
      children: [{ type: "group", id: "g1", children: [] }],
    };
    render(<FilterSheetNested {...defaultProps} initialValue={initial} />);

    const sourceGroup = { type: "group", id: "new-group", children: [] };

    const calls = (monitorForElements as any).mock.calls;
    const { onDrop } = calls[calls.length - 1][0];

    // Drop 'new-group' inside 'g1'.
    act(() => {
      onDrop({
        source: { data: { id: "new-group", item: sourceGroup } },
        location: {
          current: {
            dropTargets: [{ data: { targetId: "g1", position: "inside" } }],
          },
        },
      });
    });

    // Should be visible because MockFilterGroup recursively renders children
    expect(screen.getByTestId("child-new-group")).toBeInTheDocument();
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
});
