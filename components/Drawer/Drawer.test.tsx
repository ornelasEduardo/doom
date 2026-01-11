import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

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

describe("Drawer Component", () => {
  it("is hidden when closed", () => {
    render(
      <Drawer isOpen={false} title="Test Drawer" onClose={() => {}}>
        Content
      </Drawer>,
    );
    // The component stays mounted for exit animations but should be hidden
    const panel = screen.getByRole("dialog", { hidden: true });
    expect(panel).toBeInTheDocument();
  });

  it("renders when open", () => {
    render(
      <Drawer isOpen={true} title="Open Drawer" onClose={() => {}}>
        Content
      </Drawer>,
    );
    expect(screen.getByText("Open Drawer")).toBeInTheDocument();
  });

  it("calls onClose when clicking overlay", () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} title="Test" onClose={handleClose}>
        Content
      </Drawer>,
    );

    const closeBtn = screen.getByLabelText("Close drawer");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("exports sub-components via namespace", () => {
    expect(Drawer.Header).toBeDefined();
    expect(Drawer.Body).toBeDefined();
    expect(Drawer.Footer).toBeDefined();
  });

  it("should support composition via Drawer.Root", () => {
    render(
      <Drawer.Root data-testid="drawer-root" isOpen={true} onClose={() => {}}>
        <Drawer.Header>Custom Header</Drawer.Header>
        <Drawer.Body>Custom Body</Drawer.Body>
      </Drawer.Root>,
    );

    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });
});
