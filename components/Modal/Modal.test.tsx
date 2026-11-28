import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

// Mock Design System components
vi.mock("../..", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("Modal Component", () => {
  it("defers initial content, then retains the closed dialog for exit transitions", () => {
    const { rerender } = render(
      <Modal isOpen={false} title="Test Modal" onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
    rerender(
      <Modal isOpen title="Test Modal" onClose={() => {}}>
        Content
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    rerender(
      <Modal isOpen={false} title="Test Modal" onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(dialog).toBeInTheDocument();
    expect(dialog).not.toHaveAttribute("open");
  });

  it("should render when isOpen is true with accessibility attributes", () => {
    render(
      <Modal isOpen={true} title="Test Modal" onClose={() => {}}>
        Content
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Test Modal" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      expect.stringMatching(/modal-title/),
    );
  });

  it("should render content inside modal body", () => {
    render(
      <Modal isOpen={true} title="Test Modal" onClose={() => {}}>
        <p>My Description</p>
        <div>Content</div>
      </Modal>,
    );

    expect(screen.getByText("My Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} title="Test Modal" onClose={handleClose}>
        Content
      </Modal>,
    );

    // The close button is the only button in our mock
    fireEvent.click(screen.getByRole("button"));
    expect(handleClose).toHaveBeenCalled();
  });

  it("should call onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} title="Test Modal" onClose={handleClose}>
        Content
      </Modal>,
    );

    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it("exports sub-components via namespace", () => {
    expect(Modal.Header).toBeDefined();
    expect(Modal.Body).toBeDefined();
    expect(Modal.Footer).toBeDefined();
  });

  it("should support composition via Modal.Root", () => {
    render(
      <Modal.Root data-testid="modal-root" isOpen={true} onClose={() => {}}>
        <Modal.Header>Custom Header</Modal.Header>
        <Modal.Body>Custom Body</Modal.Body>
        <Modal.Footer>Custom Footer</Modal.Footer>
      </Modal.Root>,
    );

    expect(screen.getByTestId("modal-root")).toBeInTheDocument();
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });
});

it("does not dismiss a text selection that starts in content and ends outside", () => {
  const close = vi.fn();
  render(
    <Modal isOpen title="Selection" onClose={close}>
      <p>Select this text</p>
    </Modal>,
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.pointerDown(screen.getByText("Select this text"));
  fireEvent.pointerUp(dialog);
  fireEvent.click(dialog, { detail: 1 });
  expect(close).not.toHaveBeenCalled();
  fireEvent.pointerDown(dialog);
  fireEvent.pointerUp(dialog);
  fireEvent.click(dialog, { detail: 1 });
  expect(close).toHaveBeenCalledTimes(1);
});

it("composes and honors a consumer click cancellation", () => {
  const close = vi.fn();
  const click = vi.fn((event: React.MouseEvent) => event.preventDefault());
  render(
    <Modal isOpen title="Guarded" onClick={click} onClose={close}>
      Content
    </Modal>,
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.pointerDown(dialog);
  fireEvent.click(dialog, { detail: 1 });
  expect(click).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
});
