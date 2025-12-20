import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock Design System components
vi.mock("../..", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Flex: ({ children }: any) => <div>{children}</div>,
}));

describe("Modal Component", () => {
  it("should be hidden when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    );
    // The component stays mounted for exit animations but should be hidden
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).not.toHaveClass(/isOpen/);
  });

  it("should render when isOpen is true with accessibility attributes", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Test Modal" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      expect.stringMatching(/modal-title/)
    );
  });

  it("should render content inside modal body", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>My Description</p>
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText("My Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    // The close button is the only button in our mock
    fireEvent.click(screen.getByRole("button"));
    expect(handleClose).toHaveBeenCalled();
  });

  it("should call onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
