import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitButton } from "./SplitButton";
import { describe, it, expect, vi } from "vitest";
import React from "react";

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
      <SplitButton primaryLabel="Save" onPrimaryClick={() => {}} items={[]} />
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("should call primary click", () => {
    const handlePrimaryClick = vi.fn();
    render(
      <SplitButton
        primaryLabel="Save"
        onPrimaryClick={handlePrimaryClick}
        items={[]}
      />
    );

    fireEvent.click(screen.getByText("Save"));
    expect(handlePrimaryClick).toHaveBeenCalled();
  });

  it("should open menu on trigger click", () => {
    render(
      <SplitButton
        primaryLabel="Save"
        onPrimaryClick={() => {}}
        items={[{ label: "Save as Draft", onClick: () => {} }]}
      />
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
        primaryLabel="Save"
        onPrimaryClick={() => {}}
        items={[{ label: "Action", onClick: handleItemClick }]}
      />
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
        primaryLabel="Save"
        onPrimaryClick={() => {}}
        items={[]}
        variant="secondary"
      />
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
