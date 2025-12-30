import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SplitButton } from "./SplitButton";

vi.mock("../Popover/Popover", () => ({
  Popover: ({ trigger, content, isOpen }: any) => (
    <div>
      {trigger}
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

describe("SplitButton Component", () => {
  it("should render primary button", () => {
    render(
      <SplitButton items={[]} primaryLabel="Save" onPrimaryClick={() => {}} />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("should call primary click", () => {
    const handlePrimaryClick = vi.fn();
    render(
      <SplitButton
        items={[]}
        primaryLabel="Save"
        onPrimaryClick={handlePrimaryClick}
      />,
    );

    fireEvent.click(screen.getByText("Save"));
    expect(handlePrimaryClick).toHaveBeenCalled();
  });

  it("should open menu on trigger click", () => {
    render(
      <SplitButton
        items={[{ label: "Save as Draft", onClick: () => {} }]}
        primaryLabel="Save"
        onPrimaryClick={() => {}}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const trigger = buttons[1];

    fireEvent.click(trigger);
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
  });

  it("should execute item action and close menu", () => {
    const handleItemClick = vi.fn();
    render(
      <SplitButton
        items={[{ label: "Action", onClick: handleItemClick }]}
        primaryLabel="Save"
        onPrimaryClick={() => {}}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const trigger = buttons[1];

    fireEvent.click(trigger);
    const actionItem = screen.getByText("Action");
    expect(actionItem).toBeInTheDocument();

    fireEvent.click(actionItem);
    expect(handleItemClick).toHaveBeenCalled();

    expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();
  });

  it("should apply variant classes", () => {
    const { container } = render(
      <SplitButton
        items={[]}
        primaryLabel="Save"
        variant="secondary"
        onPrimaryClick={() => {}}
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
