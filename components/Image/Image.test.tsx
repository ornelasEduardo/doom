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

  it("keeps relative CSS dimensions out of pixel attributes and mixed-unit ratios", () => {
    const { rerender } = render(
      <Image alt="Scaled" height={160} src="test.jpg" width="20rem" />,
    );
    const img = screen.getByRole("img");
    const wrapper = img.parentElement!;
    expect(wrapper.style.width).toBe("20rem");
    expect(wrapper.style.aspectRatio).toBe("");
    expect(img).not.toHaveAttribute("width");
    expect(img).toHaveAttribute("height", "160");

    rerender(
      <Image alt="Scaled" height="10rem" src="test.jpg" width="20rem" />,
    );
    expect(wrapper.style.aspectRatio).toBe("20 / 10");
    expect(img).not.toHaveAttribute("height");

    rerender(<Image alt="Scaled" height="160px" src="test.jpg" width={320} />);
    expect(wrapper.style.aspectRatio).toBe("320 / 160");
    expect(img).toHaveAttribute("width", "320");
    expect(img).toHaveAttribute("height", "160");
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
