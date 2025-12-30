import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Dropdown } from "./Dropdown";

// Mock Design System
// Mock Design System
vi.mock("../Button/Button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../Popover/Popover", () => ({
  Popover: ({ trigger, content, isOpen }: any) => (
    <div>
      {trigger}
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

describe("Dropdown Component", () => {
  it("should render trigger", () => {
    render(<Dropdown items={[]} triggerLabel="Menu" />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("should open menu on click", () => {
    render(
      <Dropdown
        items={[{ label: "Item 1", onClick: () => {} }]}
        triggerLabel="Menu"
      />,
    );

    fireEvent.click(screen.getByText("Menu"));
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("should call item onClick and close", () => {
    const handleItemClick = vi.fn();
    render(
      <Dropdown
        items={[{ label: "Item 1", onClick: handleItemClick }]}
        triggerLabel="Menu"
      />,
    );

    fireEvent.click(screen.getByText("Menu"));
    fireEvent.click(screen.getByText("Item 1"));

    expect(handleItemClick).toHaveBeenCalled();
    expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();
  });
});
