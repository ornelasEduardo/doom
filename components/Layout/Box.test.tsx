import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Box } from "./Box";

describe("Box Component", () => {
  it("renders correctly", () => {
    render(<Box>Test Content</Box>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies semantic width tokens", () => {
    const { container } = render(<Box width="panel" />);
    // Check style attribute directly to avoid JSDOM validation issues with vars
    expect(container.firstChild).toHaveAttribute(
      "style",
      expect.stringContaining("--width-panel"),
    );
  });

  it("applies semantic height tokens", () => {
    const { container } = render(<Box height="screen-h" />);
    expect(container.firstChild).toHaveAttribute(
      "style",
      expect.stringContaining("--height-screen"),
    );
  });

  it("supports polymorphic 'as' prop", () => {
    render(<Box as="section">Section Content</Box>);
    const element = screen.getByText("Section Content");
    expect(element.tagName).toBe("SECTION");
  });

  it("handles numeric sizing (pixels)", () => {
    const { container } = render(<Box width={300} />);
    // Numeric values become px strings, which check out easier
    expect(container.firstChild).toHaveStyle({ width: "300px" });
  });

  it("applies flex shortcuts", () => {
    const { container } = render(<Box flex grow shrink />);
    expect(container.firstChild).toHaveStyle({
      flex: "1",
      flexGrow: "1",
      flexShrink: "1",
    });
  });

  it("renders as flex child with boolean/number mix", () => {
    const { container } = render(<Box grow={2} shrink={0} />);
    expect(container.firstChild).toHaveStyle({
      flexGrow: "2",
      flexShrink: "0",
    });
  });
});
