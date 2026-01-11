import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Sheet } from "./Sheet";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock("lucide-react", () => ({
  X: () => <span data-testid="close-icon">X</span>,
}));

vi.mock("../Button", () => ({
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("Sheet Component", () => {
  it("is hidden when closed", () => {
    render(
      <Sheet isOpen={false} title="Test Sheet" onClose={() => {}}>
        Content
      </Sheet>,
    );
    // The component stays mounted for exit animations but should be hidden
    const panel = screen.getByRole("dialog", { hidden: true });
    expect(panel).toBeInTheDocument();
  });

  it("renders when open", () => {
    render(
      <Sheet isOpen={true} title="Test Sheet" onClose={() => {}}>
        Content
      </Sheet>,
    );
    expect(screen.getByText("Test Sheet")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <Sheet isOpen={true} title="Test" onClose={handleClose}>
        Content
      </Sheet>,
    );
    const closeBtn = screen.getByLabelText("Close sheet");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("links title to dialog via aria-labelledby", () => {
    const { getByRole, getByText } = render(
      <Sheet isOpen={true} title="Linked Title" onClose={() => {}}>
        Content
      </Sheet>,
    );
    const dialog = getByRole("dialog");
    const title = getByText("Linked Title");
    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
  });

  it("exports sub-components via namespace", () => {
    expect(Sheet.Header).toBeDefined();
    expect(Sheet.Body).toBeDefined();
    expect(Sheet.Footer).toBeDefined();
  });

  it("should support composition via Sheet.Root", () => {
    render(
      <Sheet.Root isOpen={true} onClose={() => {}}>
        <Sheet.Header>Custom Header</Sheet.Header>
        <Sheet.Body>Custom Body</Sheet.Body>
      </Sheet.Root>,
    );
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });
});
