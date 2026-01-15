import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("renders with children", () => {
    render(<CopyButton value="test">Copy</CopyButton>);

    expect(screen.getByRole("button")).toHaveTextContent("Copy");
  });

  it("copies value to clipboard on click", async () => {
    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    render(<CopyButton value="test-value">Copy</CopyButton>);

    fireEvent.click(screen.getByRole("button"));

    expect(mockWriteText).toHaveBeenCalledWith("test-value");
  });

  it("shows copied text after clicking", async () => {
    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    render(
      <CopyButton copiedText="Done!" value="test">
        Copy
      </CopyButton>,
    );

    fireEvent.click(screen.getByRole("button"));

    // Wait for text change
    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("Done!");
    });
  });

  it("applies variant prop", () => {
    render(
      <CopyButton value="test" variant="ghost">
        Copy
      </CopyButton>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies size prop", () => {
    render(
      <CopyButton size="sm" value="test">
        Copy
      </CopyButton>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
