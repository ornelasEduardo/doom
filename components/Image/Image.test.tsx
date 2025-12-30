import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Image } from "./Image";

describe("Image Component", () => {
  it("renders with proper attributes", () => {
    render(<Image alt="Test Image" fit="cover" src="test.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "test.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
  });

  it("handles loading state correctly", async () => {
    render(<Image alt="Loading Test" src="test.jpg" />);
    const img = screen.getByRole("img");

    expect(img).toHaveClass(/hidden/);

    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass(/visible/);
    });
  });

  it("switches to fallbackSrc on error", async () => {
    render(
      <Image alt="Fallback Test" fallbackSrc="fallback.jpg" src="broken.jpg" />,
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

    render(<Image alt="Blob Test" src={url} />);
    const img = screen.getByRole("img");

    expect(img.getAttribute("src")).toMatch(/^blob:/);
    expect(img).toHaveClass(/hidden/);

    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass(/visible/);
    });
  });
});
