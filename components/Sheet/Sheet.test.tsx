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
  Button: ({ children, onClick, "aria-label": ariaLabel }: any) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("Sheet Component", () => {
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
});
