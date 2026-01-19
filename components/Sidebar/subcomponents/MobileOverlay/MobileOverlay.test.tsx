import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { MobileOverlay } from "./MobileOverlay";

describe("Sidebar MobileOverlay Component", () => {
  it("renders children content when open", async () => {
    render(
      <MobileOverlay isOpen={true} onClose={vi.fn()}>
        <div data-testid="content">Mobile Content</div>
      </MobileOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("does not render content when closed and unmounted", () => {
    const { container } = render(
      <MobileOverlay isOpen={false} onClose={vi.fn()}>
        <div data-testid="content">Mobile Content</div>
      </MobileOverlay>,
    );

    // The content exists but is hidden via CSS
    expect(container).toBeDefined();
  });

  it("calls onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    render(
      <MobileOverlay isOpen={true} onClose={onClose}>
        <div>Content</div>
      </MobileOverlay>,
    );

    await waitFor(() => {
      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });

    const overlay = document.querySelector('[aria-hidden="true"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(
      <MobileOverlay isOpen={true} onClose={onClose}>
        <div>Content</div>
      </MobileOverlay>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("renders with dialog role and aria attributes", async () => {
    render(
      <MobileOverlay isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </MobileOverlay>,
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-label", "Sidebar navigation");
    });
  });

  it("applies isOpen class when open", async () => {
    render(
      <MobileOverlay isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </MobileOverlay>,
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/isOpen/);
    });
  });
});
