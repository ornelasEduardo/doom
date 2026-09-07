import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { SeriesPoint } from "./SeriesPoint";

describe("SeriesPoint", () => {
  it("renders correctly with required props", () => {
    const { container } = render(
      <svg>
        <SeriesPoint x={10} y={20} />
      </svg>,
    );
    const circle = container.querySelector("circle");
    expect(circle).toBeTruthy();
    expect(circle).toHaveAttribute("cx", "10");
    expect(circle).toHaveAttribute("cy", "20");
  });

  it("applies hover styles", () => {
    const { container } = render(
      <svg>
        <SeriesPoint isHovered color="red" x={10} y={20} />
      </svg>,
    );
    const circle = container.querySelector("circle");
    expect(circle).toHaveAttribute("r", "8");
  });

  it("renders nothing if coordinates are invalid", () => {
    const { container } = render(
      <svg>
        <SeriesPoint x={NaN} y={20} />
      </svg>,
    );
    expect(container.querySelector("circle")).toBeNull();
  });
});

it("keeps datum on the node for hit testing without serializing a DOM attribute", () => {
  const datum = { value: 42 };
  const { container, rerender } = render(
    <svg>
      <SeriesPoint data-testid="mark" datum={datum} x={10} y={20} />
    </svg>,
  );
  const circle = container.querySelector("circle") as SVGCircleElement & {
    __data__?: unknown;
  };
  expect(circle).not.toHaveAttribute("datum");
  expect(circle.__data__).toBe(datum);
  expect(circle).toHaveAttribute("data-testid", "mark");
  const next = { value: 73 };
  rerender(
    <svg>
      <SeriesPoint datum={next} x={10} y={20} />
    </svg>,
  );
  expect(circle.__data__).toBe(next);
});
