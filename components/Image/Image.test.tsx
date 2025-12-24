import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Image } from "./Image";
import { describe, it, expect } from "vitest";
import React from "react";

describe("Image Component", () => {
  it("renders with proper attributes", () => {
    render(<Image src="test.jpg" alt="Test Image" fit="cover" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "test.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
  });

  it("handles loading state correctly", async () => {
    render(<Image src="test.jpg" alt="Loading Test" />);
    const img = screen.getByRole("img");

    expect(img).toHaveAttribute("data-loaded", "false");

    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveAttribute("data-loaded", "true");
    });
  });

  it("switches to fallbackSrc on error", async () => {
    render(
      <Image src="broken.jpg" fallbackSrc="fallback.jpg" alt="Fallback Test" />
    );
    const img = screen.getByRole("img");

    fireEvent.error(img);

    await waitFor(() => {
      expect(img).toHaveAttribute("src", "fallback.jpg");
    });
  });
  it("handles blob URLs correctly", async () => {
    const blob = new Blob(["test"], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    render(<Image src={url} alt="Blob Test" />);
    const img = screen.getByRole("img");

    expect(img.getAttribute("src")).toMatch(/^blob:/);
    expect(img).toHaveAttribute("data-loaded", "false");

    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveAttribute("data-loaded", "true");
    });
  });
});
