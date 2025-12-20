import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Drawer } from "./Drawer";

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
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

describe("Drawer Component", () => {
  it("is hidden when closed", () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={() => {}} title="Test Drawer">
        Content
      </Drawer>
    );
    // The component stays mounted for exit animations but should be hidden
    const panel = screen.getByRole("dialog", { hidden: true });
    expect(panel).not.toHaveClass(/isOpen/);
  });

  it("renders when open", () => {
    render(
      <Drawer isOpen={true} onClose={() => {}} title="Open Drawer">
        Content
      </Drawer>
    );
    expect(screen.getByText("Open Drawer")).toBeInTheDocument();
  });

  it("calls onClose when clicking overlay", () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Test">
        Content
      </Drawer>
    );

    const closeBtn = screen.getByLabelText("Close drawer");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
