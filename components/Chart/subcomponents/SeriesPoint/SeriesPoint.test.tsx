import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { SeriesPoint } from "./SeriesPoint";

describe("SeriesPoint", () => {
  it("renders correctly with required props", () => {
    const { container } = render(<SeriesPoint x={10} y={20} />);
    const circle = container.querySelector("circle");
    expect(circle).toBeTruthy();
    expect(circle).toHaveAttribute("cx", "10");
    expect(circle).toHaveAttribute("cy", "20");
  });

  it("applies hover styles", () => {
    const { container } = render(
      <SeriesPoint isHovered color="red" x={10} y={20} />,
    );
    const circle = container.querySelector("circle");
    // We can't easily check computed styles in jsdom without better mocking,
    // but we can check if attributes update if we used attributes.
    // Here we use style prop.
    // stroke-width should be 2 when hovered.
    // stroke-width should be 2 when hovered.
    expect(circle?.style.strokeWidth).toBe("2");
  });

  it("renders nothing if coordinates are invalid", () => {
    const { container } = render(<SeriesPoint x={NaN} y={20} />);
    expect(container.firstChild).toBeNull();
  });
});
